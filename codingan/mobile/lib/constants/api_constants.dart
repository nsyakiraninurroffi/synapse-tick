const String baseUrl = 'http://10.0.2.2:3001/api'; // Android emulator localhost
// const String baseUrl = 'http://localhost:3001/api'; // iOS simulator

class ApiEndpoints {
  static const String login = '$baseUrl/auth/login';
  static const String me = '$baseUrl/auth/me';
  static const String gateVerify = '$baseUrl/gate/verify';
  static const String gateSync = '$baseUrl/gate/sync';
  static const String gateDownload = '$baseUrl/gate/download';
  static const String vendorPay = '$baseUrl/vendors/pay';
  static const String vendorTransactions = '$baseUrl/vendors/transactions';
  static const String walletBalance = '$baseUrl/wallet/balance';
}
