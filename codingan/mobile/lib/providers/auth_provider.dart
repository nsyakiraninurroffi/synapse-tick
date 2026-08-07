import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';

class AuthProvider extends ChangeNotifier {
  final _storage = const FlutterSecureStorage();
  
  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = true;

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _user != null;
  bool get isLoading => _isLoading;
  String? get role => _user?['role'] as String?;
  String? get nama => _user?['nama'] as String?;

  AuthProvider() {
    _loadFromStorage();
  }

  Future<void> _loadFromStorage() async {
    try {
      final token = await _storage.read(key: 'token');
      final userStr = await _storage.read(key: 'user');
      if (token != null && userStr != null) {
        _token = token;
        _user = json.decode(userStr) as Map<String, dynamic>;
      }
    } catch (_) {
      await _storage.deleteAll();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await http.post(
        Uri.parse(ApiEndpoints.login),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      final data = json.decode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && data['success'] == true) {
        final userData = data['data'] as Map<String, dynamic>;
        _token = userData['token'] as String;
        _user = userData['user'] as Map<String, dynamic>;

        // FIX: Validate role - Allow organizer, staff, and vendor roles for gate scanner & vendor POS app
        final role = _user?['role'] as String?;
        if (role != 'organizer' && role != 'staff' && role != 'vendor') {
          _token = null;
          _user = null;
          _isLoading = false;
          notifyListeners();
          return 'Akses ditolak. Hanya Staff, Vendor, atau Organizer yang dapat menggunakan aplikasi ini.';
        }

        await _storage.write(key: 'token', value: _token);
        await _storage.write(key: 'user', value: json.encode(_user));
        _isLoading = false;
        notifyListeners();
        return null; // null = success
      } else {
        _isLoading = false;
        notifyListeners();
        return data['message'] as String? ?? 'Login gagal.';
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
    }
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    _token = null;
    _user = null;
    notifyListeners();
  }

  Map<String, String> get authHeaders => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $_token',
  };
}
