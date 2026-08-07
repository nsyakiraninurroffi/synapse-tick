import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityProvider extends ChangeNotifier {
  bool _isOnline = true;
  final Connectivity _connectivity = Connectivity();

  bool get isOnline => _isOnline;
  bool get isOffline => !_isOnline;

  ConnectivityProvider() {
    _init();
  }

  Future<void> _init() async {
    try {
      final results = await _connectivity.checkConnectivity();
      _updateStatus(results);

      _connectivity.onConnectivityChanged.listen((results) {
        _updateStatus(results);
      });
    } catch (e) {
      debugPrint('Connectivity init error: $e');
    }
  }

  void _updateStatus(dynamic results) {
    if (results is List<ConnectivityResult>) {
      _isOnline = !results.contains(ConnectivityResult.none);
    } else if (results is ConnectivityResult) {
      _isOnline = results != ConnectivityResult.none;
    }
    notifyListeners();
  }

  Future<bool> checkConnection() async {
    try {
      final results = await _connectivity.checkConnectivity();
      _updateStatus(results);
    } catch (_) {}
    return _isOnline;
  }
}
