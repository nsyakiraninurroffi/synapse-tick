import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart' as enc;

class CryptoService {
  // Must match backend AES_SECRET_KEY (32 chars for AES-256)
  static const String _aesKey = 'ticketing_aes_256_secret_key_32ch';

  /// Decrypt a base64-encoded AES-256 token produced by the backend (CryptoJS)
  /// Note: CryptoJS uses OpenSSL EVP_BytesToKey salted format ("Salted__" + 8-byte salt + ciphertext)
  static Map<String, dynamic>? decryptQRToken(String token) {
    try {
      // FIX: token is directly the Base64 OpenSSL string (U2FsdGVkX1...) produced by CryptoJS.
      // Decode base64 directly to raw cipher bytes instead of treating as utf8.
      final cipherBytes = base64.decode(token.trim());
      if (cipherBytes.length < 16) return null;

      // Verify "Salted__" header (0x53, 0x61, 0x6C, 0x74, 0x65, 0x64, 0x5F, 0x5F)
      final header = utf8.decode(cipherBytes.sublist(0, 8));
      if (header != 'Salted__') return null;

      // Extract salt (bytes 8–15)
      final salt = cipherBytes.sublist(8, 16);
      final cipherData = cipherBytes.sublist(16);

      // Derive key + IV using EVP_BytesToKey with MD5 (CryptoJS default)
      final keyIv = _evpBytesToKey(utf8.encode(_aesKey), salt, 48);
      final key = enc.Key(Uint8List.fromList(keyIv.sublist(0, 32)));
      final iv = enc.IV(Uint8List.fromList(keyIv.sublist(32, 48)));

      final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc));
      final decrypted = encrypter.decryptBytes(enc.Encrypted(Uint8List.fromList(cipherData)), iv: iv);
      final jsonString = utf8.decode(decrypted);

      return json.decode(jsonString) as Map<String, dynamic>;
    } catch (e) {
      // Token invalid or wrong key
      return null;
    }
  }

  /// EVP_BytesToKey implementation (MD5-based, matches CryptoJS default)
  static List<int> _evpBytesToKey(List<int> password, List<int> salt, int keySize) {
    final derived = <int>[];
    List<int> prev = [];
    while (derived.length < keySize) {
      final data = [...prev, ...password, ...salt];
      prev = _md5(data);
      derived.addAll(prev);
    }
    return derived.sublist(0, keySize);
  }

  static List<int> _md5(List<int> data) {
    return md5.convert(data).bytes;
  }

  /// Extract ticketId from QR token payload (for offline verification)
  static String? extractTicketId(String token) {
    final payload = decryptQRToken(token);
    return payload?['ticketId'] as String?;
  }

  /// Validate token type
  static bool isValidGateToken(Map<String, dynamic>? payload) {
    if (payload == null) return false;
    return payload['type'] == 'GATE_ACCESS' &&
           payload['ticketId'] != null &&
           payload['userId'] != null;
  }
}
