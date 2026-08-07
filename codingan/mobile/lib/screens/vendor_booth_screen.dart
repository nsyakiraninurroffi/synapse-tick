import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/connectivity_provider.dart';
import '../constants/api_constants.dart';
import '../theme/app_theme.dart';

class VendorBoothScreen extends StatefulWidget {
  const VendorBoothScreen({super.key});

  @override
  State<VendorBoothScreen> createState() => _VendorBoothScreenState();
}

class _VendorBoothScreenState extends State<VendorBoothScreen> {
  final _nominalCtrl = TextEditingController();
  final _keteranganCtrl = TextEditingController();
  final MobileScannerController _scanCtrl = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
  );

  bool _isScanning = false;
  bool _isProcessing = false;
  String? _scannedWalletId;
  Map<String, dynamic>? _lastTransaction;
  String? _error;
  double _totalRevenue = 0;
  List<Map<String, dynamic>> _recentTransactions = [];
  bool _loadingTrx = false;

  final List<double> _quickAmounts = [15000, 25000, 50000, 75000];

  @override
  void initState() {
    super.initState();
    _loadTransactions();
  }

  @override
  void dispose() {
    _nominalCtrl.dispose();
    _keteranganCtrl.dispose();
    _scanCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadTransactions() async {
    final auth = context.read<AuthProvider>();
    setState(() => _loadingTrx = true);
    try {
      final res = await http.get(
        Uri.parse(ApiEndpoints.vendorTransactions),
        headers: auth.authHeaders,
      );
      final data = json.decode(res.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        final d = data['data'] as Map<String, dynamic>;
        setState(() {
          _totalRevenue = double.tryParse(d['totalRevenue']?.toString() ?? '0') ?? 0;
          _recentTransactions = (d['transactions'] as List).cast<Map<String, dynamic>>();
        });
      }
    } catch (_) {}
    setState(() => _loadingTrx = false);
  }

  void _startScan() {
    setState(() { _isScanning = true; _scannedWalletId = null; _lastTransaction = null; _error = null; });
    _scanCtrl.start();
  }

  void _onQRDetected(BarcodeCapture capture) {
    if (_scannedWalletId != null) return;
    final raw = capture.barcodes.firstOrNull?.rawValue;
    if (raw == null || raw.isEmpty) return;

    _scanCtrl.stop();
    setState(() { _scannedWalletId = raw; _isScanning = false; });
  }

  Future<void> _processPayment() async {
    final nominal = double.tryParse(_nominalCtrl.text.trim());
    if (_scannedWalletId == null) { setState(() => _error = 'Scan QR wallet terlebih dahulu.'); return; }
    if (nominal == null || nominal < 1000) { setState(() => _error = 'Nominal minimal Rp 1.000.'); return; }

    final connectivity = context.read<ConnectivityProvider>();
    if (!connectivity.isOnline) {
      setState(() => _error = 'Vendor booth membutuhkan koneksi internet untuk memproses pembayaran.');
      return;
    }

    setState(() { _isProcessing = true; _error = null; });
    final auth = context.read<AuthProvider>();

    try {
      final res = await http.post(
        Uri.parse(ApiEndpoints.vendorPay),
        headers: auth.authHeaders,
        body: json.encode({
          'walletIdentifier': _scannedWalletId,
          'nominal': nominal,
          'keterangan': _keteranganCtrl.text.trim().isEmpty ? 'Pembelian di booth' : _keteranganCtrl.text.trim(),
        }),
      );

      final data = json.decode(res.body) as Map<String, dynamic>;
      if (data['success'] == true) {
        setState(() {
          _lastTransaction = data['data'] as Map<String, dynamic>;
          _nominalCtrl.clear();
          _keteranganCtrl.clear();
          _scannedWalletId = null;
        });
        await _loadTransactions();
      } else {
        setState(() => _error = data['message'] as String? ?? 'Pembayaran gagal.');
      }
    } catch (e) {
      setState(() => _error = 'Koneksi gagal: $e');
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  void _reset() {
    setState(() {
      _scannedWalletId = null;
      _lastTransaction = null;
      _error = null;
      _nominalCtrl.clear();
      _keteranganCtrl.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final connectivity = context.watch<ConnectivityProvider>();
    final fmt = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

    return Scaffold(
      backgroundColor: AppTheme.surfaceVariant,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  const Icon(Icons.storefront_rounded, color: AppTheme.primary, size: 24),
                  const SizedBox(width: 8),
                  const Text('Vendor Booth', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: connectivity.isOnline ? AppTheme.success.withOpacity(0.15) : AppTheme.error.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: connectivity.isOnline ? AppTheme.success.withOpacity(0.4) : AppTheme.error.withOpacity(0.4)),
                    ),
                    child: Text(
                      connectivity.isOnline ? '● Online' : '● Offline',
                      style: TextStyle(
                        color: connectivity.isOnline ? AppTheme.success : AppTheme.error,
                        fontSize: 11, fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Revenue Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF064E3B), Color(0xFF065F46)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.success.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Pendapatan Hari Ini', style: TextStyle(color: AppTheme.success.withOpacity(0.8), fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(
                      fmt.format(_totalRevenue),
                      style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900),
                    ),
                    Text('${_recentTransactions.length} transaksi', style: TextStyle(color: AppTheme.success.withOpacity(0.7), fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Success Result
              if (_lastTransaction != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.success.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.success.withOpacity(0.4)),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 40),
                      const SizedBox(height: 8),
                      const Text('Pembayaran Berhasil!', style: TextStyle(color: AppTheme.success, fontSize: 16, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Nominal', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                          Text(fmt.format(double.tryParse(_lastTransaction!['nominal']?.toString() ?? '0') ?? 0),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Pelanggan', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                          Text(_lastTransaction!['holder']?.toString() ?? '-', style: const TextStyle(color: Colors.white)),
                        ],
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Saldo Sesudah', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                          Text(fmt.format(double.tryParse(_lastTransaction!['saldoSesudah']?.toString() ?? '0') ?? 0),
                            style: const TextStyle(color: AppTheme.success, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: _reset,
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, minimumSize: const Size(double.infinity, 44)),
                        child: const Text('Transaksi Baru'),
                      ),
                    ],
                  ),
                )
              else ...[
                // Scan / Input panel
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border.withOpacity(0.5)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Scan QR / NFC Wallet Pelanggan',
                        style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),

                      // Scanner or scanned result
                      if (_isScanning)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: SizedBox(
                            height: 200,
                            child: MobileScanner(controller: _scanCtrl, onDetect: _onQRDetected),
                          ),
                        )
                      else if (_scannedWalletId != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.primary.withOpacity(0.4)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.qr_code_rounded, color: AppTheme.primary, size: 20),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Wallet terdeteksi', style: TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                                    Text(
                                      _scannedWalletId!.length > 20
                                          ? '...${_scannedWalletId!.substring(_scannedWalletId!.length - 20)}'
                                          : _scannedWalletId!,
                                      style: const TextStyle(color: Colors.white, fontSize: 12, fontFamily: 'monospace'),
                                    ),
                                  ],
                                ),
                              ),
                              GestureDetector(
                                onTap: _reset,
                                child: const Icon(Icons.close, color: AppTheme.textSecondary, size: 18),
                              ),
                            ],
                          ),
                        )
                      else
                        ElevatedButton.icon(
                          onPressed: _startScan,
                          icon: const Icon(Icons.qr_code_scanner),
                          label: const Text('Scan QR Wallet'),
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 48),
                            backgroundColor: AppTheme.surface,
                            foregroundColor: Colors.white,
                            side: BorderSide(color: AppTheme.primary.withOpacity(0.5)),
                          ),
                        ),

                      const SizedBox(height: 14),

                      // Quick amounts
                      const Text('Nominal Cepat', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _quickAmounts.map((a) =>
                          GestureDetector(
                            onTap: () => setState(() => _nominalCtrl.text = a.toInt().toString()),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: _nominalCtrl.text == a.toInt().toString()
                                    ? AppTheme.primary.withOpacity(0.3)
                                    : AppTheme.surface,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: _nominalCtrl.text == a.toInt().toString()
                                      ? AppTheme.primary
                                      : AppTheme.border.withOpacity(0.5),
                                ),
                              ),
                              child: Text(
                                fmt.format(a),
                                style: TextStyle(
                                  color: _nominalCtrl.text == a.toInt().toString() ? AppTheme.primary : AppTheme.textSecondary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ).toList(),
                      ),

                      const SizedBox(height: 12),

                      // Nominal input
                      TextField(
                        controller: _nominalCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                        decoration: InputDecoration(
                          labelText: 'Nominal (Rp)',
                          prefixText: 'Rp ',
                          prefixStyle: const TextStyle(color: AppTheme.textSecondary),
                          hintText: '0',
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 10),

                      TextField(
                        controller: _keteranganCtrl,
                        style: const TextStyle(color: Colors.white),
                        decoration: const InputDecoration(labelText: 'Keterangan (opsional)', hintText: 'Nasi goreng + es teh'),
                      ),

                      if (_error != null) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.error.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTheme.error.withOpacity(0.3)),
                          ),
                          child: Text(_error!, style: const TextStyle(color: AppTheme.error, fontSize: 13)),
                        ),
                      ],

                      const SizedBox(height: 14),

                      ElevatedButton.icon(
                        onPressed: _isProcessing ? null : _processPayment,
                        icon: _isProcessing
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.payment_rounded),
                        label: Text(_isProcessing ? 'Memproses...' : 'Proses Pembayaran'),
                        style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 52)),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 16),

              // Recent Transactions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Transaksi Terbaru', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                  GestureDetector(
                    onTap: _loadTransactions,
                    child: const Icon(Icons.refresh, color: AppTheme.textSecondary, size: 18),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              if (_loadingTrx)
                const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: AppTheme.primary)))
              else if (_recentTransactions.isEmpty)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: AppTheme.cardBg, borderRadius: BorderRadius.circular(12)),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.receipt_long_outlined, color: AppTheme.textSecondary.withOpacity(0.4), size: 40),
                        const SizedBox(height: 8),
                        Text('Belum ada transaksi.', style: TextStyle(color: AppTheme.textSecondary)),
                      ],
                    ),
                  ),
                )
              else
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.border.withOpacity(0.5)),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _recentTransactions.take(10).length,
                    separatorBuilder: (_, __) => Divider(color: AppTheme.border.withOpacity(0.3), height: 1),
                    itemBuilder: (ctx, i) {
                      final trx = _recentTransactions[i];
                      final nominal = double.tryParse(trx['nominal']?.toString() ?? '0') ?? 0;
                      final holder = (trx['wallet'] as Map?)
                          ?['user']
                          ?['nama'] as String? ?? '-';
                      final waktu = trx['waktu'] != null
                          ? DateFormat('HH:mm, d MMM').format(DateTime.parse(trx['waktu'].toString()))
                          : '-';
                      return ListTile(
                        leading: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color: AppTheme.success.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.arrow_downward_rounded, color: AppTheme.success, size: 20),
                        ),
                        title: Text(holder, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                        subtitle: Text(waktu, style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                        trailing: Text(
                          fmt.format(nominal),
                          style: const TextStyle(color: AppTheme.success, fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                      );
                    },
                  ),
                ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
