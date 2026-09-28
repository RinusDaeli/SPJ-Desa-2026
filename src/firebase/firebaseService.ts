import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import {
  DesaProfile,
  SpjDocument,
  MasterRekanan,
  MasterBarang,
  UserAccount,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface DesaCloudPackage {
  desaId: string;
  namaDesa: string;
  kodeDesa: string;
  kecamatan: string;
  desa: DesaProfile;
  spjs: SpjDocument[];
  rekanans: MasterRekanan[];
  barangs: MasterBarang[];
  users: UserAccount[];
  lastUpdated: string;
  spjCount: number;
}

export interface CloudDesaSummary {
  desaId: string;
  namaDesa: string;
  kodeDesa: string;
  kecamatan: string;
  spjCount: number;
  lastUpdated: string;
}

/**
 * Membersihkan objek secara rekursif dari nilai `undefined`.
 * Firestore SDK melempar error: "Unsupported field value: undefined"
 * jika ada field dengan nilai undefined.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirestore(value);
    }
  }
  return cleaned as T;
}

/**
 * Validasi koneksi ke server Firestore
 */
export async function testConnection(): Promise<boolean> {
  const path = 'system_meta/connection';
  try {
    const connDoc = doc(db, 'system_meta', 'connection');
    await setDoc(connDoc, { lastPing: new Date().toISOString() }, { merge: true });
    await getDocFromServer(connDoc);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    console.warn('Firebase Firestore test connection failed:', error);
    return false;
  }
}

// -------------------------------------------------------------
// REAL-TIME AUTO SYNC ACROSS ALL DEVICES (MULTI-DEVICE SUPPORT)
// -------------------------------------------------------------

/**
 * Listen real-time untuk SPJ Documents
 */
export function subscribeToSpjs(
  onData: (spjs: SpjDocument[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colPath = 'spj_documents';
  const q = collection(db, colPath);
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SpjDocument[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as SpjDocument);
      });
      onData(items);
    },
    (error) => {
      console.warn('Gagal mendengarkan perubahan SPJ Firestore:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Listen real-time untuk Desa Profiles
 */
export function subscribeToDesas(
  onData: (desas: DesaProfile[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colPath = 'desa_profiles';
  const q = collection(db, colPath);
  return onSnapshot(
    q,
    (snapshot) => {
      const items: DesaProfile[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DesaProfile);
      });
      onData(items);
    },
    (error) => {
      console.warn('Gagal mendengarkan perubahan Desa Profiles Firestore:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Listen real-time untuk Master Rekanan
 */
export function subscribeToRekanans(
  onData: (rekanans: MasterRekanan[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colPath = 'master_rekanans';
  const q = collection(db, colPath);
  return onSnapshot(
    q,
    (snapshot) => {
      const items: MasterRekanan[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as MasterRekanan);
      });
      onData(items);
    },
    (error) => {
      console.warn('Gagal mendengarkan master rekanans:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Listen real-time untuk Master Standar Barang
 */
export function subscribeToBarangs(
  onData: (barangs: MasterBarang[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colPath = 'master_barangs';
  const q = collection(db, colPath);
  return onSnapshot(
    q,
    (snapshot) => {
      const items: MasterBarang[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as MasterBarang);
      });
      onData(items);
    },
    (error) => {
      console.warn('Gagal mendengarkan master barangs:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Listen real-time untuk User Accounts
 */
export function subscribeToUsers(
  onData: (users: UserAccount[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colPath = 'user_accounts';
  const q = collection(db, colPath);
  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserAccount[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as UserAccount);
      });
      onData(items);
    },
    (error) => {
      console.warn('Gagal mendengarkan user accounts:', error);
      if (onError) onError(error);
    }
  );
}

// -------------------------------------------------------------
// DIRECT MUTATION SAVERS (AUTO-SAVED TO CLOUD INSTANTLY)
// -------------------------------------------------------------

export async function saveSpjToCloud(spj: SpjDocument): Promise<void> {
  const path = `spj_documents/${spj.id}`;
  try {
    const spjRef = doc(db, 'spj_documents', spj.id);
    await setDoc(spjRef, cleanForFirestore(spj), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteSpjFromCloud(spjId: string): Promise<void> {
  const path = `spj_documents/${spjId}`;
  try {
    const spjRef = doc(db, 'spj_documents', spjId);
    await deleteDoc(spjRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveDesaToCloud(desa: DesaProfile): Promise<void> {
  const path = `desa_profiles/${desa.id}`;
  try {
    const desaRef = doc(db, 'desa_profiles', desa.id);
    await setDoc(desaRef, cleanForFirestore(desa), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteDesaFromCloud(desaId: string): Promise<void> {
  const path = `desa_profiles/${desaId}`;
  try {
    const desaRef = doc(db, 'desa_profiles', desaId);
    await deleteDoc(desaRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveRekananToCloud(rekanan: MasterRekanan): Promise<void> {
  const path = `master_rekanans/${rekanan.id}`;
  try {
    const ref = doc(db, 'master_rekanans', rekanan.id);
    await setDoc(ref, cleanForFirestore(rekanan), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteRekananFromCloud(rekananId: string): Promise<void> {
  const path = `master_rekanans/${rekananId}`;
  try {
    const ref = doc(db, 'master_rekanans', rekananId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveBarangToCloud(barang: MasterBarang): Promise<void> {
  const path = `master_barangs/${barang.id}`;
  try {
    const ref = doc(db, 'master_barangs', barang.id);
    await setDoc(ref, cleanForFirestore(barang), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteBarangFromCloud(barangId: string): Promise<void> {
  const path = `master_barangs/${barangId}`;
  try {
    const ref = doc(db, 'master_barangs', barangId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveUserToCloud(user: UserAccount): Promise<void> {
  const path = `user_accounts/${user.id}`;
  try {
    const ref = doc(db, 'user_accounts', user.id);
    await setDoc(ref, cleanForFirestore(user), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  const path = `user_accounts/${userId}`;
  try {
    const ref = doc(db, 'user_accounts', userId);
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Initial Bootstrap:
 * Memeriksa setiap koleksi Firestore (Profil Desa, Master Rekanan, Master Barang, Dokumen SPJ, Akun Pengguna).
 * Jika ada koleksi yang masih kosong, unggah data awal agar semua perangkat yang terhubung langsung melihat katalog bersama yang sama.
 */
export async function bootstrapInitialCloudDataIfNeeded(initialData: {
  desas: DesaProfile[];
  spjs: SpjDocument[];
  masterRekanans: MasterRekanan[];
  masterBarangs: MasterBarang[];
  users: UserAccount[];
}): Promise<boolean> {
  try {
    // Periksa apakah database sudah pernah di-bootstrap sebelumnya.
    // Jika sudah, JANGAN PERNAH mengisi ulang data yang telah dihapus pengguna!
    const bootstrapRef = doc(db, 'system_settings', 'bootstrap');
    const bootstrapSnap = await getDoc(bootstrapRef);
    if (bootstrapSnap.exists() && bootstrapSnap.data()?.completed) {
      return false;
    }

    let bootstrappedAny = false;

    // 1. Periksa & Inisialisasi Master Rekanan (Katalog Bersama Semua Desa)
    const rekanansSnap = await getDocs(collection(db, 'master_rekanans'));
    if (rekanansSnap.empty && initialData.masterRekanans.length > 0) {
      console.log('Firebase Cloud: master_rekanans masih kosong. Melakukan inisialisasi awal...');
      const batch = writeBatch(db);
      for (const r of initialData.masterRekanans) {
        batch.set(doc(db, 'master_rekanans', r.id), cleanForFirestore(r));
      }
      await batch.commit();
      bootstrappedAny = true;
    }

    // 2. Periksa & Inisialisasi Master Barang (Katalog Bersama Semua Desa)
    const barangsSnap = await getDocs(collection(db, 'master_barangs'));
    if (barangsSnap.empty && initialData.masterBarangs.length > 0) {
      console.log('Firebase Cloud: master_barangs masih kosong. Melakukan inisialisasi awal...');
      const batch = writeBatch(db);
      for (const b of initialData.masterBarangs) {
        batch.set(doc(db, 'master_barangs', b.id), cleanForFirestore(b));
      }
      await batch.commit();
      bootstrappedAny = true;
    }

    // 3. Periksa & Inisialisasi Desa Profiles
    const desasSnap = await getDocs(collection(db, 'desa_profiles'));
    if (desasSnap.empty && initialData.desas.length > 0) {
      console.log('Firebase Cloud: desa_profiles masih kosong. Melakukan inisialisasi awal...');
      const batch = writeBatch(db);
      for (const d of initialData.desas) {
        batch.set(doc(db, 'desa_profiles', d.id), cleanForFirestore(d));
      }
      await batch.commit();
      bootstrappedAny = true;
    }

    // 4. Periksa & Inisialisasi Akun Pengguna
    const usersSnap = await getDocs(collection(db, 'user_accounts'));
    if (usersSnap.empty && initialData.users.length > 0) {
      console.log('Firebase Cloud: user_accounts masih kosong. Melakukan inisialisasi awal...');
      const batch = writeBatch(db);
      for (const u of initialData.users) {
        batch.set(doc(db, 'user_accounts', u.id), cleanForFirestore(u));
      }
      await batch.commit();
      bootstrappedAny = true;
    }

    // 5. Periksa & Inisialisasi SPJ Documents
    const spjsSnap = await getDocs(collection(db, 'spj_documents'));
    if (spjsSnap.empty && initialData.spjs.length > 0) {
      console.log('Firebase Cloud: spj_documents masih kosong. Melakukan inisialisasi awal...');
      const batch = writeBatch(db);
      for (const s of initialData.spjs) {
        batch.set(doc(db, 'spj_documents', s.id), cleanForFirestore(s));
      }
      await batch.commit();
      bootstrappedAny = true;
    }

    // Tandai inisialisasi awal telah selesai secara permanen
    await setDoc(bootstrapRef, {
      completed: true,
      completedAt: new Date().toISOString(),
      appName: 'Aplikasi SPJ Desa Nias Barat',
    });

    if (bootstrappedAny) {
      console.log('Inisialisasi data awal ke Cloud Firestore selesai!');
    }
    return bootstrappedAny;
  } catch (err) {
    console.warn('Gagal memeriksa bootstrap cloud data:', err);
    return false;
  }
}

/**
 * Sinkronkan seluruh data Master Rekanan & Master Barang ke Cloud Firebase.
 * Menghapus data yang telah dihapus pengguna dari Cloud secara permanen.
 */
export async function syncAllMasterDataToCloud(
  rekanans: MasterRekanan[],
  barangs: MasterBarang[]
): Promise<{ success: boolean; message: string }> {
  try {
    const currentRekananIds = new Set(rekanans.map((r) => r.id));
    const currentBarangIds = new Set(barangs.map((b) => b.id));

    // Periksa dokumen yang ada di Cloud
    const existingRekanansSnap = await getDocs(collection(db, 'master_rekanans'));
    const existingBarangsSnap = await getDocs(collection(db, 'master_barangs'));

    const batch = writeBatch(db);

    // Hapus dokumen rekanan di Cloud yang sudah tidak ada di list
    existingRekanansSnap.forEach((d) => {
      if (!currentRekananIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    // Hapus dokumen barang di Cloud yang sudah tidak ada di list
    existingBarangsSnap.forEach((d) => {
      if (!currentBarangIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    // Simpan semua data rekanan aktif
    for (const r of rekanans) {
      batch.set(doc(db, 'master_rekanans', r.id), cleanForFirestore(r));
    }
    // Simpan semua data barang aktif
    for (const b of barangs) {
      batch.set(doc(db, 'master_barangs', b.id), cleanForFirestore(b));
    }

    await batch.commit();
    return {
      success: true,
      message: `Berhasil menyinkronkan ${rekanans.length} Rekanan dan ${barangs.length} Barang ke Cloud Firebase!`,
    };
  } catch (err: any) {
    console.error('Error syncing master data to cloud:', err);
    return {
      success: false,
      message: `Gagal sinkronisasi master data: ${err?.message || 'Kesalahan koneksi'}`,
    };
  }
}

// -------------------------------------------------------------
// SNAPSHOT & MANUAL BACKUP PACKAGES (LEGACY & MODAL COMPATIBLE)
// -------------------------------------------------------------

/**
 * Upload / Sinkronisasi khusus SATU DESA ke Cloud Firebase
 */
export async function uploadDesaToCloud(
  desa: DesaProfile,
  spjsForDesa: SpjDocument[],
  allRekanans: MasterRekanan[],
  allBarangs: MasterBarang[],
  allUsers: UserAccount[]
): Promise<{ success: boolean; message: string }> {
  try {
    const desaId = desa.id;
    const nowIso = new Date().toISOString();

    const linkedUsers = allUsers.filter((u) => u.desaId === desaId);

    // 1. Simpan dokumen Paket Snapshot Desa
    const packageDocRef = doc(db, 'desa_cloud_packages', desaId);
    const packageData: DesaCloudPackage = {
      desaId,
      namaDesa: desa.namaDesa,
      kodeDesa: desa.kodeDesa,
      kecamatan: desa.kecamatan,
      desa,
      spjs: spjsForDesa,
      rekanans: allRekanans, // Rekanan katalog bersama seluruh desa
      barangs: allBarangs,   // Barang katalog bersama seluruh desa
      users: linkedUsers,
      lastUpdated: nowIso,
      spjCount: spjsForDesa.length,
    };
    await setDoc(packageDocRef, cleanForFirestore(packageData));

    // 2. Simpan juga dokumen profil desa
    const profileDocRef = doc(db, 'desa_profiles', desaId);
    await setDoc(profileDocRef, cleanForFirestore({ ...desa, updatedAt: nowIso }));

    // 3. Simpan SPJ di koleksi `spj_documents`
    const qSpj = query(collection(db, 'spj_documents'), where('desaId', '==', desaId));
    const existingSpjDocs = await getDocs(qSpj);
    const currentSpjIds = new Set(spjsForDesa.map((s) => s.id));

    const batch = writeBatch(db);

    existingSpjDocs.forEach((d) => {
      if (!currentSpjIds.has(d.id)) {
        batch.delete(d.ref);
      }
    });

    for (const spj of spjsForDesa) {
      const spjRef = doc(db, 'spj_documents', spj.id);
      batch.set(spjRef, cleanForFirestore(spj), { merge: true });
    }

    for (const user of linkedUsers) {
      const userRef = doc(db, 'user_accounts', user.id);
      batch.set(userRef, cleanForFirestore(user), { merge: true });
    }

    await batch.commit();

    return {
      success: true,
      message: `Data Desa ${desa.namaDesa} (${spjsForDesa.length} SPJ) berhasil diunggah ke Cloud Firebase!`,
    };
  } catch (error: any) {
    console.error('Error uploading desa to cloud:', error);
    return {
      success: false,
      message: `Gagal mengunggah ke Cloud: ${error?.message || 'Kesalahan jaringan/izin Firebase'}`,
    };
  }
}

/**
 * Unduh khusus SATU DESA dari Cloud Firebase
 */
export async function downloadDesaFromCloud(
  desaId: string
): Promise<{
  success: boolean;
  message: string;
  packageData?: DesaCloudPackage;
}> {
  try {
    const packageDocRef = doc(db, 'desa_cloud_packages', desaId);
    const snap = await getDoc(packageDocRef);

    if (snap.exists()) {
      const data = snap.data() as DesaCloudPackage;
      return {
        success: true,
        message: `Data Desa ${data.namaDesa} berhasil ditarik dari Cloud (${data.spjs?.length || 0} SPJ)!`,
        packageData: data,
      };
    }

    const profileDocRef = doc(db, 'desa_profiles', desaId);
    const profileSnap = await getDoc(profileDocRef);

    if (!profileSnap.exists()) {
      return {
        success: false,
        message: `Data untuk Desa ID "${desaId}" belum pernah diunggah ke Cloud Firebase.`,
      };
    }

    const desa = profileSnap.data() as DesaProfile;

    const qSpj = query(collection(db, 'spj_documents'), where('desaId', '==', desaId));
    const spjDocs = await getDocs(qSpj);
    const spjs: SpjDocument[] = [];
    spjDocs.forEach((d) => spjs.push(d.data() as SpjDocument));

    const qUsers = query(collection(db, 'user_accounts'), where('desaId', '==', desaId));
    const userDocs = await getDocs(qUsers);
    const users: UserAccount[] = [];
    userDocs.forEach((d) => users.push(d.data() as UserAccount));

    const fallbackPackage: DesaCloudPackage = {
      desaId,
      namaDesa: desa.namaDesa,
      kodeDesa: desa.kodeDesa,
      kecamatan: desa.kecamatan,
      desa,
      spjs,
      rekanans: [],
      barangs: [],
      users,
      lastUpdated: new Date().toISOString(),
      spjCount: spjs.length,
    };

    return {
      success: true,
      message: `Data Desa ${desa.namaDesa} (${spjs.length} SPJ) berhasil ditarik dari Cloud!`,
      packageData: fallbackPackage,
    };
  } catch (error: any) {
    console.error('Error downloading desa from cloud:', error);
    return {
      success: false,
      message: `Gagal menarik data dari Cloud: ${error?.message || 'Kesalahan jaringan/Firebase'}`,
    };
  }
}

/**
 * Ambil daftar ringkasan desa yang tersimpan di Cloud Firebase
 */
export async function getCloudDesasSummary(): Promise<CloudDesaSummary[]> {
  try {
    const colRef = collection(db, 'desa_cloud_packages');
    const snaps = await getDocs(colRef);
    const list: CloudDesaSummary[] = [];

    snaps.forEach((docSnap) => {
      const d = docSnap.data() as DesaCloudPackage;
      list.push({
        desaId: d.desaId || docSnap.id,
        namaDesa: d.namaDesa || 'Desa Tanpa Nama',
        kodeDesa: d.kodeDesa || '',
        kecamatan: d.kecamatan || '',
        spjCount: d.spjCount ?? (d.spjs?.length || 0),
        lastUpdated: d.lastUpdated || '',
      });
    });

    return list;
  } catch (error) {
    console.warn('Gagal memuat ringkasan desa dari cloud:', error);
    return [];
  }
}

/**
 * Upload Menyeluruh (Semua Desa & Seluruh Sistem)
 */
export async function uploadAllToCloud(data: {
  desas: DesaProfile[];
  spjs: SpjDocument[];
  masterRekanans: MasterRekanan[];
  masterBarangs: MasterBarang[];
  users: UserAccount[];
}): Promise<{ success: boolean; message: string }> {
  try {
    const nowIso = new Date().toISOString();

    const masterDocRef = doc(db, 'system_backups', 'latest_full_backup');
    await setDoc(masterDocRef, cleanForFirestore({
      ...data,
      lastUpdated: nowIso,
      appName: 'Aplikasi SPJ Desa Nias Barat',
    }));

    // Sinkronkan seluruh Master Rekanan & Master Barang ke Cloud
    await syncAllMasterDataToCloud(data.masterRekanans, data.masterBarangs);

    for (const d of data.desas) {
      const desaSpjs = data.spjs.filter((s) => s.desaId === d.id);
      await uploadDesaToCloud(
        d,
        desaSpjs,
        data.masterRekanans,
        data.masterBarangs,
        data.users
      );
    }

    return {
      success: true,
      message: `Semua data (${data.desas.length} Desa, ${data.spjs.length} SPJ) berhasil disinkronkan ke Cloud Firebase!`,
    };
  } catch (error: any) {
    console.error('Error uploading all to cloud:', error);
    return {
      success: false,
      message: `Gagal sinkronisasi menyeluruh: ${error?.message || 'Kesalahan koneksi'}`,
    };
  }
}

/**
 * Unduh Menyeluruh (Semua Desa & Seluruh Sistem)
 */
export async function downloadAllFromCloud(): Promise<{
  success: boolean;
  message: string;
  data?: {
    desas: DesaProfile[];
    spjs: SpjDocument[];
    masterRekanans: MasterRekanan[];
    masterBarangs: MasterBarang[];
    users: UserAccount[];
  };
}> {
  try {
    const masterDocRef = doc(db, 'system_backups', 'latest_full_backup');
    const masterSnap = await getDoc(masterDocRef);

    if (masterSnap.exists()) {
      const payload = masterSnap.data();
      return {
        success: true,
        message: 'Seluruh data sistem berhasil diunduh dari Cloud Firebase!',
        data: {
          desas: payload.desas || [],
          spjs: payload.spjs || [],
          masterRekanans: payload.masterRekanans || [],
          masterBarangs: payload.masterBarangs || [],
          users: payload.users || [],
        },
      };
    }

    const packagesSnap = await getDocs(collection(db, 'desa_cloud_packages'));
    if (!packagesSnap.empty) {
      const desas: DesaProfile[] = [];
      const spjs: SpjDocument[] = [];
      const users: UserAccount[] = [];
      let masterRekanans: MasterRekanan[] = [];
      let masterBarangs: MasterBarang[] = [];

      packagesSnap.forEach((snap) => {
        const pkg = snap.data() as DesaCloudPackage;
        if (pkg.desa) desas.push(pkg.desa);
        if (pkg.spjs) spjs.push(...pkg.spjs);
        if (pkg.users) users.push(...pkg.users);
        if (pkg.rekanans) masterRekanans.push(...pkg.rekanans);
        if (pkg.barangs) masterBarangs.push(...pkg.barangs);
      });

      const uniqueRekanans = Array.from(new Map(masterRekanans.map((r) => [r.id, r])).values());
      const uniqueBarangs = Array.from(new Map(masterBarangs.map((b) => [b.id, b])).values());
      const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values());

      return {
        success: true,
        message: `Berhasil mengunduh ${desas.length} desa dari Cloud Firebase!`,
        data: {
          desas,
          spjs,
          masterRekanans: uniqueRekanans,
          masterBarangs: uniqueBarangs,
          users: uniqueUsers,
        },
      };
    }

    return {
      success: false,
      message: 'Belum ada data yang tersimpan di Cloud Firebase.',
    };
  } catch (error: any) {
    console.error('Error downloading all from cloud:', error);
    return {
      success: false,
      message: `Gagal mengunduh dari Cloud: ${error?.message || 'Kesalahan koneksi'}`,
    };
  }
}
