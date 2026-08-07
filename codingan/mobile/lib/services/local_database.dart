import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class LocalDatabase {
  static Database? _db;
  
  // In-memory cache for Web platform
  static final List<Map<String, dynamic>> _webOfflineTickets = [];
  static final List<Map<String, dynamic>> _webCheckinLogs = [];
  static final List<Map<String, dynamic>> _webCachedEvents = [];

  static Future<Database?> get db async {
    if (kIsWeb) return null;
    _db ??= await _initDb();
    return _db;
  }

  static Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'ticketflow_offline.db');

    return openDatabase(
      path,
      version: 2,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  static Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS offline_tickets (
        id TEXT PRIMARY KEY,
        qr_token TEXT NOT NULL,
        user_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'lunas',
        downloaded_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS offline_checkin_logs (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        check_in_at TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS cached_events (
        id TEXT PRIMARY KEY,
        nama_event TEXT NOT NULL,
        lokasi TEXT NOT NULL,
        tanggal TEXT NOT NULL,
        cached_at TEXT NOT NULL
      )
    ''');
  }

  static Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('ALTER TABLE offline_tickets ADD COLUMN event_id TEXT DEFAULT ""');
    }
  }

  // ============ OFFLINE TICKETS ============

  static Future<void> saveOfflineTickets(List<Map<String, dynamic>> tickets) async {
    if (kIsWeb) {
      _webOfflineTickets.clear();
      _webOfflineTickets.addAll(tickets.map((t) => {
        'id': t['id'],
        'qr_token': t['qrToken'],
        'user_id': t['userId'] ?? '',
        'event_id': t['eventId'] ?? '',
        'status': t['status'] ?? 'lunas',
        'downloaded_at': DateTime.now().toIso8601String(),
      }));
      return;
    }

    final database = await db;
    if (database == null) return;
    final batch = database.batch();
    for (final ticket in tickets) {
      batch.insert(
        'offline_tickets',
        {
          'id': ticket['id'],
          'qr_token': ticket['qrToken'],
          'user_id': ticket['userId'] ?? '',
          'event_id': ticket['eventId'] ?? '',
          'status': ticket['status'] ?? 'lunas',
          'downloaded_at': DateTime.now().toIso8601String(),
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  static Future<Map<String, dynamic>?> verifyTicketOffline(String ticketId) async {
    if (kIsWeb) {
      try {
        return _webOfflineTickets.firstWhere(
          (t) => t['id'] == ticketId && t['status'] == 'lunas',
        );
      } catch (_) {
        return null;
      }
    }

    final database = await db;
    if (database == null) return null;
    final result = await database.query(
      'offline_tickets',
      where: 'id = ? AND status = ?',
      whereArgs: [ticketId, 'lunas'],
    );
    if (result.isEmpty) return null;
    return result.first;
  }

  static Future<void> markTicketCheckedIn(String ticketId) async {
    if (kIsWeb) {
      for (final t in _webOfflineTickets) {
        if (t['id'] == ticketId) {
          t['status'] = 'check_in';
        }
      }
      return;
    }

    final database = await db;
    if (database == null) return;
    await database.update(
      'offline_tickets',
      {'status': 'check_in'},
      where: 'id = ?',
      whereArgs: [ticketId],
    );
  }

  // ============ OFFLINE CHECK-IN LOGS ============

  static Future<void> saveOfflineCheckIn(String ticketId) async {
    final log = {
      'id': 'LOG_${ticketId}_${DateTime.now().millisecondsSinceEpoch}',
      'ticket_id': ticketId,
      'check_in_at': DateTime.now().toIso8601String(),
      'synced': 0,
      'created_at': DateTime.now().toIso8601String(),
    };

    if (kIsWeb) {
      _webCheckinLogs.add(log);
      return;
    }

    final database = await db;
    if (database == null) return;
    await database.insert(
      'offline_checkin_logs',
      log,
      conflictAlgorithm: ConflictAlgorithm.ignore,
    );
  }

  static Future<List<Map<String, dynamic>>> getUnsyncedLogs() async {
    if (kIsWeb) {
      return _webCheckinLogs.where((l) => l['synced'] == 0).toList();
    }

    final database = await db;
    if (database == null) return [];
    return database.query(
      'offline_checkin_logs',
      where: 'synced = ?',
      whereArgs: [0],
    );
  }

  static Future<void> markLogsAsSynced(List<String> logIds) async {
    if (logIds.isEmpty) return;

    if (kIsWeb) {
      for (final l in _webCheckinLogs) {
        if (logIds.contains(l['id'])) {
          l['synced'] = 1;
        }
      }
      return;
    }

    final database = await db;
    if (database == null) return;
    await database.update(
      'offline_checkin_logs',
      {'synced': 1},
      where: 'id IN (${logIds.map((_) => '?').join(',')})',
      whereArgs: logIds,
    );
  }

  static Future<int> getUnsyncedCount() async {
    if (kIsWeb) {
      return _webCheckinLogs.where((l) => l['synced'] == 0).length;
    }

    final database = await db;
    if (database == null) return 0;
    final result = await database.rawQuery(
      'SELECT COUNT(*) as count FROM offline_checkin_logs WHERE synced = 0',
    );
    return result.first['count'] as int;
  }

  // ============ CACHED EVENTS ============

  static Future<void> cacheEvent(Map<String, dynamic> event) async {
    final cached = {
      'id': event['id'],
      'nama_event': event['namaEvent'],
      'lokasi': event['lokasi'],
      'tanggal': event['tanggal'],
      'cached_at': DateTime.now().toIso8601String(),
    };

    if (kIsWeb) {
      _webCachedEvents.add(cached);
      return;
    }

    final database = await db;
    if (database == null) return;
    await database.insert(
      'cached_events',
      cached,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  static Future<List<Map<String, dynamic>>> getCachedEvents() async {
    if (kIsWeb) return _webCachedEvents;

    final database = await db;
    if (database == null) return [];
    return database.query('cached_events', orderBy: 'tanggal ASC');
  }
}
