import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/connectivity_provider.dart';
import '../theme/app_theme.dart';
import 'gate_scanner_screen.dart';
import 'vendor_booth_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final connectivity = context.watch<ConnectivityProvider>();
    final isStaff = auth.role == 'staff' || auth.role == 'organizer';
    final isVendor = auth.role == 'vendor';

    // Role-based screens
    final screens = isStaff
        ? [const GateScannerScreen(), const _ProfileScreen()]
        : [const VendorBoothScreen(), const _ProfileScreen()];

    final navItems = isStaff
        ? [
            const BottomNavigationBarItem(icon: Icon(Icons.qr_code_scanner), label: 'Gate Scanner'),
            const BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profil'),
          ]
        : [
            const BottomNavigationBarItem(icon: Icon(Icons.storefront_outlined), label: 'Vendor Booth'),
            const BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profil'),
          ];

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.confirmation_number_rounded, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            const Text('SynapseTick'),
          ],
        ),
        actions: [
          // Connectivity indicator
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: connectivity.isOnline
                  ? AppTheme.success.withOpacity(0.15)
                  : AppTheme.error.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: connectivity.isOnline
                    ? AppTheme.success.withOpacity(0.4)
                    : AppTheme.error.withOpacity(0.4),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: connectivity.isOnline ? AppTheme.success : AppTheme.error,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  connectivity.isOnline ? 'Online' : 'Offline',
                  style: TextStyle(
                    color: connectivity.isOnline ? AppTheme.success : AppTheme.error,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: AppTheme.border.withOpacity(0.5))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          backgroundColor: AppTheme.surfaceVariant,
          selectedItemColor: AppTheme.primary,
          unselectedItemColor: AppTheme.textSecondary,
          items: navItems,
          type: BottomNavigationBarType.fixed,
        ),
      ),
    );
  }
}

class _ProfileScreen extends StatelessWidget {
  const _ProfileScreen();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppTheme.surfaceVariant,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SizedBox(height: 20),
              // Avatar
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                  borderRadius: BorderRadius.circular(40),
                ),
                child: Center(
                  child: Text(
                    (auth.nama ?? 'U').substring(0, 1).toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(auth.nama ?? '-', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text(
                auth.user?['email'] ?? '-',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                ),
                child: Text(
                  (auth.role ?? '-').toUpperCase(),
                  style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(height: 40),
              // Logout Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        backgroundColor: AppTheme.cardBg,
                        title: const Text('Konfirmasi Logout', style: TextStyle(color: Colors.white)),
                        content: const Text('Apakah Anda yakin ingin keluar?', style: TextStyle(color: AppTheme.textSecondary)),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: Text('Batal', style: TextStyle(color: AppTheme.textSecondary)),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.pop(context);
                              auth.logout();
                            },
                            child: const Text('Logout', style: TextStyle(color: AppTheme.error)),
                          ),
                        ],
                      ),
                    );
                  },
                  icon: const Icon(Icons.logout, color: AppTheme.error),
                  label: const Text('Logout', style: TextStyle(color: AppTheme.error)),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: AppTheme.error.withOpacity(0.5)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
