import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

/// TicketFlow Gen Z Login Screen
/// Features: Glassmorphism cards, animated gradient bg, Google Sign-In placeholder
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  bool _googleLoading = false;
  String? _error;
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.25),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutCubic));
    _animCtrl.forward();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _fillDemo(String role) {
    _emailCtrl.text = '$role@ticketing.com';
    _passCtrl.text = 'password123';
    setState(() {});
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    final auth = context.read<AuthProvider>();
    final err = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);

    if (mounted) setState(() { _loading = false; _error = err; });
  }

  Future<void> _googleSignIn() async {
    setState(() { _googleLoading = true; });
    // TODO: Implement google_sign_in package
    // final GoogleSignIn _googleSignIn = GoogleSignIn();
    // final account = await _googleSignIn.signIn();
    // Call backend /api/auth/social-login with Google profile
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) {
      setState(() { _googleLoading = false; });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Google Sign-In: tambahkan Google Client ID di .env'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppTheme.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _AnimatedGradientBg(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: FadeTransition(
                opacity: _fadeAnim,
                child: SlideTransition(
                  position: _slideAnim,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Logo ──
                      Center(
                        child: Column(
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                gradient: AppTheme.primaryGradient,
                                borderRadius: BorderRadius.circular(18),
                                boxShadow: AppTheme.glowShadow,
                              ),
                              child: const Icon(Icons.confirmation_number_rounded, color: Colors.white, size: 32),
                            ),
                            const SizedBox(height: 14),
                            GradientText(
                              'TicketFlow',
                              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -1),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Platform Tiket Event Premium',
                              style: TextStyle(color: AppTheme.textMuted, fontSize: 13, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 36),

                      // ── Main Card ──
                      GlassCard(
                        padding: const EdgeInsets.all(24),
                        borderRadius: AppTheme.radiusXl,
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Header
                              Row(
                                children: [
                                  const Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Selamat Datang 👋',
                                          style: TextStyle(
                                            color: AppTheme.textPrimary,
                                            fontSize: 22,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: -0.5,
                                          ),
                                        ),
                                        SizedBox(height: 3),
                                        Text(
                                          'Masuk untuk akses tiket & e-wallet',
                                          style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                  NeonBadge('SECURE', color: AppTheme.success, icon: Icons.shield_rounded),
                                ],
                              ),
                              const SizedBox(height: 22),

                              // ── Google Sign-In Button ──
                              _SocialButton(
                                label: 'Lanjutkan dengan Google',
                                isLoading: _googleLoading,
                                onTap: _googleSignIn,
                                icon: _GoogleIcon(),
                              ),
                              const SizedBox(height: 10),

                              // Divider
                              Row(
                                children: [
                                  const Expanded(child: Divider(color: AppTheme.borderColor)),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 12),
                                    child: Text('atau', style: TextStyle(color: AppTheme.textMuted, fontSize: 11)),
                                  ),
                                  const Expanded(child: Divider(color: AppTheme.borderColor)),
                                ],
                              ),
                              const SizedBox(height: 14),

                              // ── Email Field ──
                              TextFormField(
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                autofillHints: const [AutofillHints.email],
                                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                                decoration: const InputDecoration(
                                  labelText: 'Alamat Email',
                                  hintText: 'nama@email.com',
                                  prefixIcon: Icon(Icons.email_outlined, size: 18),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) return 'Email wajib diisi.';
                                  if (!v.contains('@')) return 'Format email tidak valid.';
                                  return null;
                                },
                              ),
                              const SizedBox(height: 12),

                              // ── Password Field ──
                              TextFormField(
                                controller: _passCtrl,
                                obscureText: _obscure,
                                autofillHints: const [AutofillHints.password],
                                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
                                decoration: InputDecoration(
                                  labelText: 'Kata Sandi',
                                  hintText: '••••••••',
                                  prefixIcon: const Icon(Icons.lock_outline_rounded, size: 18),
                                  suffixIcon: IconButton(
                                    icon: Icon(
                                      _obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                      size: 18,
                                      color: AppTheme.textMuted,
                                    ),
                                    onPressed: () => setState(() => _obscure = !_obscure),
                                  ),
                                ),
                                validator: (v) => (v == null || v.isEmpty) ? 'Kata sandi wajib diisi.' : null,
                                onFieldSubmitted: (_) => _login(),
                              ),
                              const SizedBox(height: 20),

                              // ── Error Message ──
                              if (_error != null)
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.error.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: AppTheme.error.withOpacity(0.25)),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.error_outline_rounded, color: AppTheme.error, size: 16),
                                      const SizedBox(width: 8),
                                      Expanded(child: Text(_error!, style: const TextStyle(color: AppTheme.error, fontSize: 12))),
                                    ],
                                  ),
                                ),

                              // ── Login Button ──
                              GradientButton(
                                label: 'Masuk Sekarang',
                                isLoading: _loading,
                                onPressed: _loading ? null : _login,
                                icon: Icons.arrow_forward_rounded,
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // ── Demo Quick Fill ──
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceElevated.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                          border: Border.all(color: AppTheme.borderColor),
                        ),
                        child: Column(
                          children: [
                            const Text('🎭 Demo Quick Login', style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              alignment: WrapAlignment.center,
                              children: ['pengunjung', 'organizer', 'staff', 'vendor'].map((role) => GestureDetector(
                                onTap: () => _fillDemo(role),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary.withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                                    border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
                                  ),
                                  child: Text(
                                    role[0].toUpperCase() + role.substring(1),
                                    style: const TextStyle(color: AppTheme.primaryLight, fontSize: 11, fontWeight: FontWeight.w700),
                                  ),
                                ),
                              )).toList(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ── Footer ──
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Belum punya akun? ', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                          GestureDetector(
                            onTap: () { /* TODO: Navigate to register */ },
                            child: const Text(
                              'Daftar Gratis',
                              style: TextStyle(
                                color: AppTheme.primaryLight,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                decoration: TextDecoration.underline,
                                decorationColor: AppTheme.primaryLight,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Animated Gradient Background ──
class _AnimatedGradientBg extends StatefulWidget {
  final Widget child;
  const _AnimatedGradientBg({required this.child});

  @override
  State<_AnimatedGradientBg> createState() => _AnimatedGradientBgState();
}

class _AnimatedGradientBgState extends State<_AnimatedGradientBg>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 8))
      ..repeat();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        final t = _ctrl.value;
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(math.sin(t * 2 * math.pi) * 0.4 - 0.5, -1),
              end: Alignment(math.cos(t * 2 * math.pi) * 0.4 + 0.5, 1),
              colors: const [
                Color(0xFF04060F),
                Color(0xFF0D0621),
                Color(0xFF08102B),
                Color(0xFF04060F),
              ],
            ),
          ),
          child: Stack(
            children: [
              // Glow orbs
              Positioned(
                top: -80,
                left: -60,
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [AppTheme.primary.withOpacity(0.12), Colors.transparent],
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: -60,
                right: -40,
                child: Container(
                  width: 220,
                  height: 220,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [AppTheme.accent.withOpacity(0.08), Colors.transparent],
                    ),
                  ),
                ),
              ),
              widget.child,
            ],
          ),
        );
      },
    );
  }
}

// ── Social Button ──
class _SocialButton extends StatelessWidget {
  final String label;
  final Widget icon;
  final VoidCallback onTap;
  final bool isLoading;

  const _SocialButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.06),
          borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          border: Border.all(color: Colors.white.withOpacity(0.12)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isLoading)
              const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            else ...[
              icon,
              const SizedBox(width: 10),
              Text(label, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Google Icon SVG ──
class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 18,
      height: 18,
      child: CustomPaint(painter: _GooglePainter()),
    );
  }
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final center = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2;

    // Blue
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(Rect.fromCircle(center: center, radius: r), -math.pi / 2, math.pi, false, paint);

    // Red
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(Rect.fromCircle(center: center, radius: r), -math.pi / 2, -math.pi * 0.55, false, paint);

    // Yellow
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(Rect.fromCircle(center: center, radius: r), math.pi * 0.95, math.pi * 0.55, false, paint);

    // Green
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(Rect.fromCircle(center: center, radius: r), math.pi / 2, math.pi * 0.45, false, paint);
  }

  @override
  bool shouldRepaint(_) => false;
}
