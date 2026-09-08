import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class LocalDatabase {
  static final LocalDatabase instance = LocalDatabase._init();
  static Database? _database;

  LocalDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('ayusync.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 2,
      onCreate: _createDB,
      onUpgrade: (db, oldVersion, newVersion) async {
        await _ensureTables(db);
      },
      onOpen: (db) async {
        await _ensureTables(db);
      },
    );
  }

  Future<void> _ensureTables(Database db) async {
    await db.execute('''
CREATE TABLE IF NOT EXISTS sync_queue (
  operationId TEXT PRIMARY KEY,
  entityId TEXT NOT NULL,
  entity TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  createdTime TEXT NOT NULL,
  retryCount INTEGER NOT NULL,
  syncStatus TEXT NOT NULL
)
''');

    await db.execute('''
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  phone TEXT,
  village TEXT,
  abhaId TEXT,
  bloodGroup TEXT,
  dob TEXT,
  emergencyContact TEXT,
  preferredLanguage TEXT,
  district TEXT,
  state TEXT,
  pinCode TEXT,
  address TEXT,
  allergies TEXT,
  existingConditions TEXT,
  currentMedications TEXT,
  pastHistory TEXT,
  createdAt TEXT,
  isSynced INTEGER NOT NULL
)
''');

    await db.execute('''
CREATE TABLE IF NOT EXISTS app_session (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
''');
  }

  Future _createDB(Database db, int version) async {
    await _ensureTables(db);
  }

  Future<void> saveSession(Map<String, String> sessionData) async {
    final db = await instance.database;
    final batch = db.batch();
    sessionData.forEach((key, value) {
      batch.insert(
        'app_session',
        {'key': key, 'value': value},
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    });
    await batch.commit(noResult: true);
  }

  Future<Map<String, String>> getAllSession() async {
    final db = await instance.database;
    final records = await db.query('app_session');
    final map = <String, String>{};
    for (final row in records) {
      map[row['key'] as String] = row['value'] as String;
    }
    return map;
  }

  Future<void> clearSession() async {
    final db = await instance.database;
    await db.delete('app_session');
  }

  // --- Patient Local Storage ---
  Future<void> savePatient(Map<String, dynamic> patientMap) async {
    final db = await instance.database;
    await db.insert(
      'patients',
      patientMap,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getLocalPatients() async {
    final db = await instance.database;
    return await db.query('patients', orderBy: 'createdAt DESC');
  }

  Future<void> markPatientSynced(String patientId) async {
    final db = await instance.database;
    await db.update(
      'patients',
      {'isSynced': 1},
      where: 'id = ?',
      whereArgs: [patientId],
    );
  }

  // --- Sync Queue Storage ---
  Future<void> queueMutation(Map<String, dynamic> mutation) async {
    final db = await instance.database;
    await db.insert(
      'sync_queue',
      mutation,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getPendingMutations() async {
    final db = await instance.database;
    return await db.query(
      'sync_queue',
      where: 'syncStatus = ?',
      whereArgs: ['PENDING'],
      orderBy: 'createdTime ASC',
    );
  }

  Future<void> markMutationSynced(String operationId) async {
    final db = await instance.database;
    await db.update(
      'sync_queue',
      {'syncStatus': 'SYNCED'},
      where: 'operationId = ?',
      whereArgs: [operationId],
    );
  }

  Future<void> deleteSyncedMutations() async {
    final db = await instance.database;
    await db.delete(
      'sync_queue',
      where: 'syncStatus = ?',
      whereArgs: ['SYNCED'],
    );
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }
}
