export interface SiswaProfile {
  user_id: string;
  nis: string;
  kelas: string;
  jurusan: string;
  tahun_ajaran: string;
  nama_ortu?: string;
  alamat?: string;
  created_at: Date;
  updated_at: Date;
}

export interface GuruProfile {
  user_id: string;
  nip?: string;
  mata_pelajaran?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Dudi {
  id: string;
  nama_perusahaan: string;
  alamat: string;
  telepon?: string;
  email?: string;
  penanggung_jawab: string;
  bidang_usaha?: string;
  kuota_siswa?: number;
  status: 'aktif' | 'tif';
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Magang {
  id: string;
  siswa_id: string;
  guru_pembimbing_id: string;
  dudi_id: string;
  tanggal_mulai: Date;
  tanggal_selesai: Date;
  status: 'pending' | 'aktif' | 'selesai' | 'dibatalkan';
  nilai_akhir?: number;
  catatan_guru?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JurnalHarian {
  id: string;
  magang_id: string;
  tanggal: Date;
  kegiatan: string;
  foto_dokumentasi?: string;
  status_verifikasi: 'menunggu' | 'disetujui' | 'ditolak';
  catatan_guru?: string;
  verified_by?: string;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface PendaftaranMagang {
  id: string;
  siswa_id: string;
  dudi_id: string;
  status: 'menunggu' | 'diterima' | 'ditolak';
  tanggal_daftar: Date;
  catatan_siswa?: string;
  catatan_admin?: string;
  processed_by?: string;
  processed_at?: Date;
  created_at: Date;
}

export interface PengaturanSekolah {
  id: string;
  nama_sekolah: string;
  alamat_sekolah?: string;
  telepon_sekolah?: string;
  email_sekolah?: string;
  logo_sekolah?: string;
  kepala_sekolah?: string;
  tahun_ajaran_aktif?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FileUpload {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  upload_type: 'jurnal_foto' | 'logo_sekolah' | 'profile_photo';
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url?: string;
  created_at: Date;
}