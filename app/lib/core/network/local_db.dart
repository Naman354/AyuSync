import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class LocalDatabase {
  static final LocalDatabase instance = LocalDatabase._init();
  static Database? _database;

  LocalDatabase._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('ayusync_v3.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 3,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  Future _createDB(Database db, int version) async {
    const idType = 'TEXT PRIMARY KEY';
    const textType = 'TEXT NOT NULL';
    const textNullable = 'TEXT';
    const intType = 'INTEGER NOT NULL';
    const intNullable = 'INTEGER';
    const boolType = 'INTEGER NOT NULL'; // 1 or 0
    const realNullable = 'REAL';

    // 1. Sync Queue Table
    await db.execute('''
      CREATE TABLE sync_queue (
        operationId $idType,
        entityId $textType,
        entity $textType,
        operation $textType,
        payload $textType,
        createdTime $textType,
        retryCount $intType,
        syncStatus $textType
      )
    ''');

    // 2. Patients Table (Strict Backend Alignment)
    await db.execute('''
      CREATE TABLE patients (
        id $idType,
        name $textType,
        age $intNullable,
        gender $textType,
        phone $textType,
        village $textType,
        dob $textNullable,
        abhaId $textNullable,
        createdAt $textType,
        isSynced $boolType
      )
    ''');

    // 3. Assessments Table
    await db.execute('''
      CREATE TABLE assessments (
        id $idType,
        patientId $textType,
        primarySymptom $textType,
        severity $textType,
        durationDays $intType,
        vitals $textNullable,
        clinicalNotes $textNullable,
        timestamp $textType,
        isSynced $boolType
      )
    ''');

    // 4. FollowUp Tasks Table
    await db.execute('''
      CREATE TABLE follow_ups (
        id $idType,
        patientId $textType,
        patientName $textType,
        patientPhone $textType,
        doctorName $textType,
        doctorFacility $textType,
        taskDescription $textType,
        instructions $textType,
        prescribedMedicines $textNullable,
        dueDate $textType,
        status $textType,
        visitNotes $textNullable,
        completedAt $textNullable,
        isSynced $boolType
      )
    ''');

    // 5. Facilities Cache Table
    await db.execute('''
      CREATE TABLE facilities (
        id $idType,
        name $textType,
        type $textType,
        distanceKm $realNullable,
        readinessScore $intNullable,
        hasSpecialist $boolType,
        hasEmergency $boolType,
        availableBeds $intNullable,
        waitingMinutes $intNullable,
        availableServices $textNullable,
        freshness $textNullable
      )
    ''');
  }

  Future _upgradeDB(Database db, int oldVersion, int newVersion) async {
    await db.execute('DROP TABLE IF EXISTS sync_queue');
    await db.execute('DROP TABLE IF EXISTS patients');
    await db.execute('DROP TABLE IF EXISTS assessments');
    await db.execute('DROP TABLE IF EXISTS follow_ups');
    await db.execute('DROP TABLE IF EXISTS facilities');
    await _createDB(db, newVersion);
  }

  // --- CRUD Operations ---

  Future<void> insertPatient(Map<String, dynamic> patient) async {
    final db = await instance.database;
    await db.insert('patients', {
      'id': patient['id'],
      'name': patient['name'],
      'age': patient['age'],
      'gender': patient['gender'],
      'phone': patient['phone'],
      'village': patient['village'],
      'dob': patient['dob'],
      'abhaId': patient['abhaId'],
      'createdAt': patient['createdAt'],
      'isSynced': patient['isSynced'],
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getPatients() async {
    final db = await instance.database;
    return await db.query('patients', orderBy: 'createdAt DESC');
  }

  Future<void> insertAssessment(Map<String, dynamic> assessment) async {
    final db = await instance.database;
    await db.insert('assessments', assessment, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getAssessments(String patientId) async {
    final db = await instance.database;
    return await db.query('assessments', where: 'patientId = ?', whereArgs: [patientId], orderBy: 'timestamp DESC');
  }

  Future<void> insertFollowUp(Map<String, dynamic> followUp) async {
    final db = await instance.database;
    await db.insert('follow_ups', followUp, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getFollowUps() async {
    final db = await instance.database;
    return await db.query('follow_ups', orderBy: 'dueDate ASC');
  }

  Future<void> queueMutation(Map<String, dynamic> mutation) async {
    final db = await instance.database;
    await db.insert('sync_queue', mutation, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getPendingSyncMutations() async {
    final db = await instance.database;
    return await db.query('sync_queue', where: 'syncStatus = ?', whereArgs: ['PENDING'], orderBy: 'createdTime ASC');
  }

  Future<void> markMutationSynced(String operationId) async {
    final db = await instance.database;
    await db.update('sync_queue', {'syncStatus': 'SYNCED'}, where: 'operationId = ?', whereArgs: [operationId]);
  }

  Future<void> clearSyncedMutations() async {
    final db = await instance.database;
    await db.delete('sync_queue', where: 'syncStatus = ?', whereArgs: ['SYNCED']);
  }

  Future<void> close() async {
    final db = await instance.database;
    db.close();
  }
}
