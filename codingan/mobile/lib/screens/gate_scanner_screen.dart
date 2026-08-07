import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../providers/auth_provider.dart';
import '../providers/connectivity_provider.dart';
import '../services/local_database.dart';
import '../services/crypto_service.dart';
import '../constants/api_constants.dart';
import '../theme/app_theme.dart';

enum ScanResultType { granted, alreadyUsed, notPaid, invalid, notFound, offlineValid, error }

class ScanResult {
  final ScanResultType type;
  final String message;
  final Map<String, dynamic>? data;
  ScanResult(this.type, this.message, {this.data});
}

class GateScannerScreen extends StatefulWidget {
  const GateScannerScreen({super.key});

  @override
  State<GateScannerScreen> createState() => _GateScannerScreenState();
}

class _GateScannerScreenState extends State<GateScannerScreen> with WidgetsBindingObserver {
  final MobileScannerController _scannerCtrl = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isProcessing = false;
  ScanResult? _lastResult;
  int _scannedToday = 0;
  int _unsyncedCount = 0;
  bool _isSyncing = false;
  String? _selectedEventId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadStats();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _scannerCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        _scannerCtrl.start();
        break;
      case AppLifecycleState.paused:
        _scannerCtrl.stop();
        break;
      default:
        break;
    }
  }

  Future<void> _loadStats() async {
    final count = await LocalDatabase.getUnsyncedCount();
    setState(() => _unsyncedCount = count);
  }

  Future<void> _onQRDetected(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;
    final raw = barcodes.first.rawValue;
    if (raw == null || raw.isEmpty) return;

    setState(() => _isProcessing = true);
    _scannerCtrl.stop();

    final connectivity = context.read<ConnectivityProvider>();
    final auth = context.read<AuthProvider>();

    ScanResult result;

    if (connectivity.isOnline) {
      // ONLINE MODE: Hit the API
      result = await _verifyOnline(raw, auth);
    } else {
      // OFFLINE MODE: Verify against local SQLite cache
      result = await _verifyOffline(raw);
    }

    setState(() { _lastResult = result; });

    if (result.type == ScanResultType.granted || result.type == ScanResultType.offlineValid) {
      setState(() => _scannedToday++);
    }

    // Auto-resume scanning after 3 seconds
    await Future.delayed(const Duration(seconds: 3));
    if (mounted) {
      setState(() { _isProcessing = false; _lastResult = null; });
      _scannerCtrl.start();
    }

    await _loadStats();
  }

  Future<ScanResult> _verifyOnline(String token, AuthProvider auth) async {
    try {
      final response = await http.post(
        Uri.parse(ApiEndpoints.gateVerify),
        headers: auth.authHeaders,
        body: json.encode({'qrToken': token}),
      ).timeout(const Duration(seconds: 10));

      final data = json.decode(response.body) as Map<String, dynamic>;

      switch (data['gateResult']) {
        case 'GRANTED':
          return ScanResult(ScanResultType.granted, data['message'] ?? 'Akses diberikan!', data: data['data']);
        case 'ALREADY_USED':
          return ScanResult(ScanResultType.alreadyUsed, data['message'] ?? 'Tiket sudah digunakan.');
        case 'NOT_PAID':
          return ScanResult(ScanResultType.notPaid, data['message'] ?? 'Tiket belum dibayar.');
        case 'NOT_FOUND':
          return ScanResult(ScanResultType.notFound, data['message'] ?? 'Tiket tidak ditemukan.');
        default:
          return ScanResult(ScanResultType.invalid, data['message'] ?? 'QR Code tidak valid.');
      }
    } catch (e) {
      return ScanResult(ScanResultType.error, 'Koneksi gagal. Beralih ke mode offline...');
    }
  }

  Future<ScanResult> _verifyOffline(String token) async {
    // Decrypt the AES token locally
    final payload = CryptoService.decryptQRToken(token);
    if (payload == null || !CryptoService.isValidGateToken(payload)) {
      return ScanResult(ScanResultType.invalid, 'QR Code tidak valid (offline).');
    }

    final ticketId = payload['ticketId'] as String;
    final ticketData = await LocalDatabase.verifyTicketOffline(ticketId);

    if (ticketData == null) {
      return ScanResult(
        ScanResultType.notFound,
        'Tiket tidak ditemukan di cache offline.\nPastikan data sudah diunduh.',
      );
    }

    // Mark as locally checked-in
    await LocalDatabase.markTicketCheckedIn(ticketId);
    await LocalDatabase.saveOfflineCheckIn(ticketId);

    return ScanResult(
      ScanResultType.offlineValid,
      '✅ [OFFLINE] Akses diberikan!\nCheck-in akan disinkronkan saat online.',
    );
  }

  Future<void> _syncOfflineLogs() async {
    final auth = context.read<AuthProvider>();
    final connectivity = context.read<ConnectivityProvider>();

    if (!connectivity.isOnline) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tidak ada koneksi internet untuk sinkronisasi.'), backgroundColor: AppTheme.error),
      );
      return;
    }

    setState(() => _isSyncing = true);
    try {
      final logs = await LocalDatabase.getUnsyncedLogs();
      if (logs.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak ada data offline untuk disinkronkan.'), backgroundColor: AppTheme.success),
        );
        setState(() => _isSyncing = false);
        return;
      }

      final offlineLogs = logs.map((l) => {
        'ticketId': l['ticket_id'],
        'checkInAt': l['check_in_at'],
      }).toList();

      final response = await http.post(
        Uri.parse(ApiEndpoints.gateSync),
        headers: auth.authHeaders,
        body: json.encode({'offlineLogs': offlineLogs}),
      );

      final data = json.decode(response.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        final logIds = logs.map((l) => l['id'] as String).toList();
        await LocalDatabase.markLogsAsSynced(logIds);
        final syncData = data['data'] as Map<String, dynamic>;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sinkronisasi: ${syncData['success']} berhasil, ${syncData['failed']} gagal.'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sinkronisasi gagal: $e'), backgroundColor: AppTheme.error),
      );
    } finally {
      setState(() => _isSyncing = false);
      await _loadStats();
    }
  }

  Future<void> _downloadOfflineData() async {
    if (_selectedEventId == null || _selectedEventId!.isEmpty) {
      _showEventIdDialog();
      return;
    }
    final auth = context.read<AuthProvider>();
    try {
      final response = await http.get(
        Uri.parse('${ApiEndpoints.gateDownload}/$_selectedEventId'),
        headers: auth.authHeaders,
      );
      final data = json.decode(response.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        final tickets = (data['data'] as List).cast<Map<String, dynamic>>();
        await LocalDatabase.saveOfflineTickets(tickets);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${tickets.length} tiket berhasil diunduh untuk offline!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Download gagal: $e'), backgroundColor: AppTheme.error),
      );
    }
  }

  void _showEventIdDialog() {
    final ctrl = TextEditingController(text: _selectedEventId);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.cardBg,
        title: const Text('Masukkan Event ID', style: TextStyle(color: Colors.white)),
        content: TextField(
          controller: ctrl,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(hintText: 'event-demo-001'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Batal')),
          TextButton(
            onPressed: () {
              setState(() => _selectedEventId = ctrl.text.trim());
              Navigator.pop(context);
              _downloadOfflineData();
            },
            child: const Text('Download', style: TextStyle(color: AppTheme.primary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final connectivity = context.watch<ConnectivityProvider>();
    return Scaffold(
      backgroundColor: AppTheme.surfaceVariant,
      // FIX: Added SafeArea to prevent notch/status bar clipping on various Android screen sizes
      body: SafeArea(
        child: Stack(
          children: [
          Column(
            children: [
              // Stats Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                color: AppTheme.surface,
                child: Row(
                  children: [
                    _StatChip(label: 'Scan Hari Ini', value: '$_scannedToday', color: AppTheme.success),
                    const SizedBox(width: 8),
                    _StatChip(label: 'Belum Sync', value: '$_unsyncedCount',
                        color: _unsyncedCount > 0 ? AppTheme.warning : AppTheme.textSecondary),
                    const Spacer(),
                    if (_unsyncedCount > 0)
                      GestureDetector(
                        onTap: _isSyncing ? null : _syncOfflineLogs,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
                          ),
                          child: _isSyncing
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2))
                              : const Text('⟳ Sync', style: TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: _downloadOfflineData,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppTheme.success.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.success.withOpacity(0.3)),
                        ),
                        child: const Text('⬇ Unduh', style: TextStyle(color: AppTheme.success, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ),
              ),

              // Scanner View
              Expanded(
                child: Stack(
                  children: [
                    MobileScanner(
                      controller: _scannerCtrl,
                      onDetect: _onQRDetected,
                    ),

                    // Overlay Frame
                    _buildScannerOverlay(),

                    // Mode label
                    Positioned(
                      top: 16,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.6),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: connectivity.isOnline ? AppTheme.success : AppTheme.warning,
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                connectivity.isOnline ? Icons.wifi : Icons.wifi_off,
                                color: connectivity.isOnline ? AppTheme.success : AppTheme.warning,
                                size: 14,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                connectivity.isOnline ? 'MODE ONLINE' : 'MODE OFFLINE (SQLite)',
                                style: TextStyle(
                                  color: connectivity.isOnline ? AppTheme.success : AppTheme.warning,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Bottom label
                    Positioned(
                      bottom: 24,
                      left: 0,
                      right: 0,
                      child: Text(
                        'Arahkan kamera ke QR Code tiket',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Result Overlay
          if (_lastResult != null) _buildResultOverlay(_lastResult!),
        ],
      ),
    ),
  );
}

  Widget _buildScannerOverlay() {
    const size = 240.0;
    return ColorFiltered(
      colorFilter: ColorFilter.mode(Colors.black.withOpacity(0.55), BlendMode.srcOut),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Container(decoration: const BoxDecoration(color: Colors.transparent)),
          Align(
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultOverlay(ScanResult result) {
    Color bg, borderColor;
    IconData icon;

    switch (result.type) {
      case ScanResultType.granted:
      case ScanResultType.offlineValid:
        bg = AppTheme.success.withOpacity(0.95);
        borderColor = AppTheme.success;
        icon = Icons.check_circle_rounded;
        break;
      case ScanResultType.alreadyUsed:
        bg = AppTheme.warning.withOpacity(0.95);
        borderColor = AppTheme.warning;
        icon = Icons.warning_rounded;
        break;
      default:
        bg = AppTheme.error.withOpacity(0.95);
        borderColor = AppTheme.error;
        icon = Icons.cancel_rounded;
    }

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: borderColor, width: 1.5),
          boxShadow: [
            BoxShadow(color: borderColor.withOpacity(0.4), blurRadius: 20, spreadRadius: 2),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: Colors.white, size: 44),
            const SizedBox(height: 12),
            Text(
              result.message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700, height: 1.4),
            ),
            if (result.data != null) ...[
              const SizedBox(height: 8),
              Text(
                result.data!['event'] ?? '',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label, value;
  final Color color;
  const _StatChip({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: AppTheme.textSecondary, fontSize: 10)),
        Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w800)),
      ],
    );
  }
}
