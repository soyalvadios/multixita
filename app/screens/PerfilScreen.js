import { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Text, TextInput, Menu } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { registrarVehiculo, misVehiculos, subirFoto, miFoto, cambiarPassword, editarVehiculo, buildFileUrl } from '../services/api';

const TIPOS = [
  { label: 'Automóvil', value: 'auto' },
  { label: 'Motocicleta', value: 'moto' },
  { label: 'Otro', value: 'otro' },
];


function SeccionColapsable({ icono, titulo, subtitulo, children, defaultOpen = false }) {
  const [abierto, setAbierto] = useState(defaultOpen);
  return (
    <View style={styles.secColBox}>
      <TouchableOpacity style={styles.secColBtn} onPress={() => setAbierto(!abierto)}>
        <View style={styles.secColLeft}>
          <Text style={styles.secColIcono}>{icono}</Text>
          <View>
            <Text style={styles.secColTitulo}>{titulo}</Text>
            {!!subtitulo && <Text style={styles.secColSub}>{subtitulo}</Text>}
          </View>
        </View>
        <Text style={styles.secColChevron}>{abierto ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      {abierto && <View style={styles.secColContenido}>{children}</View>}
    </View>
  );
}

// ─── Modal de edición de vehículo ────────────────────────────────────────────
function ModalEditarVehiculo({ vehiculo, onCerrar, onGuardado }) {
  const [form, setForm] = useState({
    placas: vehiculo.placas || '',
    marca:  vehiculo.marca  || '',
    modelo: vehiculo.modelo || '',
    color:  vehiculo.color  || '',
    tipo:   vehiculo.tipo   || 'auto',
  });
  const [menuVisible, setMenu] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const set = (c) => (v) => setForm({ ...form, [c]: v });
  const tipoLabel = TIPOS.find(t => t.value === form.tipo)?.label || 'Automóvil';

  const guardar = async () => {
    if (!form.placas || !form.color) { setError('Placas y color son obligatorios'); return; }
    setCargando(true); setError('');
    try {
      await editarVehiculo(vehiculo.id_vehiculo, form);
      Alert.alert('✅ Listo', 'Vehículo actualizado correctamente');
      onGuardado();
      onCerrar();
    } catch (e) {
      setError(e.response?.data?.mensaje || 'Error al actualizar');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>Editar vehículo</Text>
            <TouchableOpacity onPress={onCerrar}>
              <Text style={{ fontSize: 20, color: '#aaa' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.inputLabel}>Placas *</Text>
            <TextInput value={form.placas} onChangeText={set('placas')} mode="outlined"
              style={styles.input} autoCapitalize="characters"
              activeOutlineColor="#2E7D32" outlineColor="#ddd" theme={{ roundness: 10 }}/>

            <Text style={styles.inputLabel}>Marca</Text>
            <TextInput value={form.marca} onChangeText={set('marca')} mode="outlined"
              style={styles.input} activeOutlineColor="#2E7D32" outlineColor="#ddd"
              theme={{ roundness: 10 }} placeholder="Ej. Chevrolet"/>

            <Text style={styles.inputLabel}>Modelo</Text>
            <TextInput value={form.modelo} onChangeText={set('modelo')} mode="outlined"
              style={styles.input} activeOutlineColor="#2E7D32" outlineColor="#ddd"
              theme={{ roundness: 10 }} placeholder="Ej. Beat"/>

            <Text style={styles.inputLabel}>Color *</Text>
            <TextInput value={form.color} onChangeText={set('color')} mode="outlined"
              style={styles.input} activeOutlineColor="#2E7D32" outlineColor="#ddd"
              theme={{ roundness: 10 }} placeholder="Ej. Blanco"/>

            <Text style={styles.inputLabel}>Tipo de vehículo</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenu(false)}
              anchor={
                <TouchableOpacity style={styles.dropdownBox} onPress={() => setMenu(true)}>
                  <Text style={styles.dropdownTexto}>{tipoLabel}</Text>
                  <Text style={styles.dropdownChevron}>▾</Text>
                </TouchableOpacity>
              }
            >
              {TIPOS.map((t) => (
                <Menu.Item key={t.value} title={t.label} onPress={() => { set('tipo')(t.value); setMenu(false); }}/>
              ))}
            </Menu>

            {!!error && <View style={styles.errorBox}><Text style={styles.errorTexto}>{error}</Text></View>}

            <TouchableOpacity
              style={[styles.boton, cargando && { opacity: 0.7 }]}
              onPress={guardar} disabled={cargando}
            >
              {cargando
                ? <ActivityIndicator color="#fff"/>
                : <Text style={styles.botonTexto}>Guardar cambios</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function PerfilScreen() {
  const { usuario, cerrarSesion } = useAuth();
  if (!usuario) return null;

  const [vehiculos, setVehiculos]         = useState([]);
  const [form, setForm]                   = useState({ placas: '', marca: '', modelo: '', color: '', tipo: 'auto' });
  const [errorVeh, setErrorVeh]           = useState('');
  const [cargandoVeh, setCargandoVeh]     = useState(false);
  const [menuVisible, setMenu]            = useState(false);
  const [fotoUri, setFotoUri]             = useState(null);
  const [subiendoFoto, setSubiendo]       = useState(false);
  const [vehiculoEditar, setVehEditar]    = useState(null); // vehículo seleccionado para editar

  const [passForm, setPassForm]           = useState({ actual: '', nueva: '', confirmar: '' });
  const [passError, setPassError]         = useState('');
  const [passOk, setPassOk]               = useState('');
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [verActual, setVerActual]         = useState(false);
  const [verNueva, setVerNueva]           = useState(false);
  const [verConfirmar, setVerConfirmar]   = useState(false);

  useEffect(() => { cargar(); cargarFoto(); }, []);

  const cargar = async () => {
    try { const r = await misVehiculos(); setVehiculos(r.data); } catch (e) {}
  };

  const cargarFoto = async () => {
    try {
      const r = await miFoto();
      const ruta = r.data.foto || r.data.foto_selfie;
      if (ruta) setFotoUri(buildFileUrl(ruta));
    } catch (e) {}
  };

  const seleccionarFoto = () => {
    Alert.alert('Foto de perfil', '¿Cómo quieres agregar tu foto?', [
      { text: 'Cámara',   onPress: () => abrirFuente('camera') },
      { text: 'Galería',  onPress: () => abrirFuente('library') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const abrirFuente = async (fuente) => {
    const permiso = fuente === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert('Permiso denegado'); return; }
    const resultado = fuente === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!resultado.canceled) {
      const asset = resultado.assets[0];
      setFotoUri(asset.uri);
      await subirImagen(asset);
    }
  };

  const subirImagen = async (asset) => {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('foto', { uri: asset.uri, name: `foto_${usuario.id}.jpg`, type: 'image/jpeg' });
      await subirFoto(formData);
    } catch (e) { Alert.alert('Error', 'No se pudo subir la foto'); }
    finally { setSubiendo(false); }
  };

  const set     = (c) => (v) => setForm({ ...form, [c]: v });
  const setPass = (c) => (v) => setPassForm({ ...passForm, [c]: v });

  const agregarVehiculo = async () => {
    if (!form.placas || !form.color) { setErrorVeh('Placas y color son obligatorios'); return; }
    setCargandoVeh(true); setErrorVeh('');
    try {
      await registrarVehiculo(form);
      setForm({ placas: '', marca: '', modelo: '', color: '', tipo: 'auto' });
      await cargar();
      Alert.alert('✅ Listo', 'Vehículo registrado correctamente');
    } catch (e) { setErrorVeh(e.response?.data?.mensaje || 'Error al registrar'); }
    finally { setCargandoVeh(false); }
  };

  const handleCambiarPassword = async () => {
    setPassError(''); setPassOk('');
    const { actual, nueva, confirmar } = passForm;
    if (!actual || !nueva || !confirmar) { setPassError('Completa todos los campos'); return; }
    if (nueva.length < 6) { setPassError('Mínimo 6 caracteres'); return; }
    if (nueva !== confirmar) { setPassError('Las contraseñas no coinciden'); return; }
    if (actual === nueva) { setPassError('La nueva contraseña debe ser diferente'); return; }
    setGuardandoPass(true);
    try {
      await cambiarPassword({ password_actual: actual, password_nueva: nueva });
      setPassOk('✅ Contraseña actualizada correctamente');
      setPassForm({ actual: '', nueva: '', confirmar: '' });
      setTimeout(() => setPassOk(''), 3000);
    } catch (e) { setPassError(e.response?.data?.mensaje || 'Error al cambiar contraseña'); }
    finally { setGuardandoPass(false); }
  };

  const tipoIcono = (tipo) => tipo === 'moto' ? '🏍️' : tipo === 'otro' ? '🚐' : '🚗';
  const tipoLabel = TIPOS.find(t => t.value === form.tipo)?.label || 'Automóvil';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

      {/* Modal de edición */}
      {vehiculoEditar && (
        <ModalEditarVehiculo
          vehiculo={vehiculoEditar}
          onCerrar={() => setVehEditar(null)}
          onGuardado={cargar}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarBox} onPress={seleccionarFoto}>
          {fotoUri
            ? <Image source={{ uri: fotoUri }} style={styles.avatarImg}/>
            : <Text style={styles.avatarLetra}>{usuario.nombre?.[0]}</Text>
          }
          {subiendoFoto && (
            <View style={styles.avatarOverlay}><ActivityIndicator color="#fff"/></View>
          )}
          <View style={styles.camaraIcon}><Text style={{ fontSize: 12 }}>📷</Text></View>
        </TouchableOpacity>
        <Text style={styles.nombre}>{usuario.nombre}</Text>
        <Text style={styles.matricula}>{usuario.matricula}</Text>
        <Text style={styles.detalle}>{usuario.carrera || 'Lic. Informática Administrativa y Financiera'}</Text>
      </View>

      <View style={styles.secciones}>

        {/* 🚗 Vehículos */}
        <SeccionColapsable
          icono="🚗"
          titulo="Mis vehículos"
          subtitulo={vehiculos.length > 0 ? `${vehiculos.length} registrado${vehiculos.length > 1 ? 's' : ''}` : 'Sin vehículos'}
        >
          {vehiculos.length === 0 ? (
            <View style={styles.vacioBox}>
              <Text style={styles.vacioTexto}>Sin vehículos registrados</Text>
              <Text style={styles.vacioSub}>Agrega tu vehículo para registrar entradas al campus con QR.</Text>
            </View>
          ) : (
            vehiculos.map((v) => (
              <View key={v.id_vehiculo} style={styles.vehiculoCard}>
                <View style={styles.vehiculoIcono}>
                  <Text style={{ fontSize: 22 }}>{tipoIcono(v.tipo)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placas}>{v.placas}</Text>
                  <Text style={styles.vehiculoDetalle}>{[v.marca, v.modelo].filter(Boolean).join(' · ') || 'Sin detalles'}</Text>
                  <Text style={styles.vehiculoTipo}>{v.color} · {TIPOS.find(t => t.value === v.tipo)?.label}</Text>
                </View>
                <TouchableOpacity style={styles.editarBtn} onPress={() => setVehEditar(v)}>
                  <Text style={styles.editarBtnTexto}>✏️ Editar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.divider}/>
          <Text style={styles.subTituloForm}>Agregar vehículo</Text>
          <View style={styles.instruccionBox}>
            <Text style={styles.instruccionTexto}>
              Registra tu vehículo para que el oficial de caseta pueda identificarlo al registrar tu entrada.
            </Text>
          </View>

          <Text style={styles.inputLabel}>Placas *</Text>
          <TextInput value={form.placas} onChangeText={set('placas')} mode="outlined" style={styles.input}
            autoCapitalize="characters" activeOutlineColor="#2E7D32" outlineColor="#ddd"
            theme={{ roundness: 10 }} placeholder="Ej. NYS380A"/>

          <Text style={styles.inputLabel}>Marca</Text>
          <TextInput value={form.marca} onChangeText={set('marca')} mode="outlined" style={styles.input}
            activeOutlineColor="#2E7D32" outlineColor="#ddd" theme={{ roundness: 10 }} placeholder="Ej. Chevrolet"/>

          <Text style={styles.inputLabel}>Modelo</Text>
          <TextInput value={form.modelo} onChangeText={set('modelo')} mode="outlined" style={styles.input}
            activeOutlineColor="#2E7D32" outlineColor="#ddd" theme={{ roundness: 10 }} placeholder="Ej. Beat"/>

          <Text style={styles.inputLabel}>Color *</Text>
          <TextInput value={form.color} onChangeText={set('color')} mode="outlined" style={styles.input}
            activeOutlineColor="#2E7D32" outlineColor="#ddd" theme={{ roundness: 10 }} placeholder="Ej. Blanco"/>

          <Text style={styles.inputLabel}>Tipo de vehículo *</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenu(false)}
            anchor={
              <TouchableOpacity style={styles.dropdownBox} onPress={() => setMenu(true)}>
                <Text style={styles.dropdownTexto}>{tipoLabel}</Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </TouchableOpacity>
            }
          >
            {TIPOS.map((t) => (
              <Menu.Item key={t.value} title={t.label} onPress={() => { set('tipo')(t.value); setMenu(false); }}/>
            ))}
          </Menu>

          {!!errorVeh && <View style={styles.errorBox}><Text style={styles.errorTexto}>{errorVeh}</Text></View>}

          <TouchableOpacity style={[styles.boton, cargandoVeh && { opacity: 0.7 }]} onPress={agregarVehiculo} disabled={cargandoVeh}>
            {cargandoVeh ? <ActivityIndicator color="#fff"/> : <Text style={styles.botonTexto}>Agregar vehículo</Text>}
          </TouchableOpacity>
        </SeccionColapsable>

        {/* 🔒 Cambiar contraseña */}
        <SeccionColapsable icono="🔒" titulo="Cambiar contraseña">
          <Text style={styles.inputLabel}>Contraseña actual</Text>
          <TextInput value={passForm.actual} onChangeText={setPass('actual')} mode="outlined"
            style={styles.input} secureTextEntry={!verActual} activeOutlineColor="#2E7D32"
            outlineColor="#ddd" theme={{ roundness: 10 }}
            right={<TextInput.Icon icon={verActual ? 'eye-off' : 'eye'} onPress={() => setVerActual(!verActual)}/>}/>

          <Text style={styles.inputLabel}>Contraseña nueva</Text>
          <TextInput value={passForm.nueva} onChangeText={setPass('nueva')} mode="outlined"
            style={styles.input} secureTextEntry={!verNueva} activeOutlineColor="#2E7D32"
            outlineColor="#ddd" theme={{ roundness: 10 }}
            right={<TextInput.Icon icon={verNueva ? 'eye-off' : 'eye'} onPress={() => setVerNueva(!verNueva)}/>}/>

          <Text style={styles.inputLabel}>Confirmar contraseña nueva</Text>
          <TextInput value={passForm.confirmar} onChangeText={setPass('confirmar')} mode="outlined"
            style={styles.input} secureTextEntry={!verConfirmar} activeOutlineColor="#2E7D32"
            outlineColor="#ddd" theme={{ roundness: 10 }}
            right={<TextInput.Icon icon={verConfirmar ? 'eye-off' : 'eye'} onPress={() => setVerConfirmar(!verConfirmar)}/>}/>

          {!!passError && <View style={styles.errorBox}><Text style={styles.errorTexto}>{passError}</Text></View>}
          {!!passOk    && <View style={styles.okBox}><Text style={styles.okTexto}>{passOk}</Text></View>}

          <TouchableOpacity style={[styles.boton, guardandoPass && { opacity: 0.7 }]} onPress={handleCambiarPassword} disabled={guardandoPass}>
            {guardandoPass ? <ActivityIndicator color="#fff"/> : <Text style={styles.botonTexto}>Guardar nueva contraseña</Text>}
          </TouchableOpacity>
        </SeccionColapsable>

      </View>

      {/* Cuenta */}
      <View style={styles.cuentaBox}>
        <Text style={styles.cuentaTitulo}>Cuenta</Text>
        <TouchableOpacity style={styles.cerrarBtn} onPress={cerrarSesion}>
          <Text style={styles.cerrarTexto}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:           { backgroundColor: '#2E7D32', paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  avatarBox:        { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  avatarImg:        { width: 88, height: 88, borderRadius: 44 },
  avatarLetra:      { fontSize: 36, fontWeight: '700', color: '#fff' },
  avatarOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  camaraIcon:       { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#fff', borderRadius: 10, padding: 2 },
  nombre:           { color: '#fff', fontSize: 18, fontWeight: '700' },
  matricula:        { color: '#A5D6A7', fontSize: 13, marginTop: 2 },
  detalle:          { color: '#C8E6C9', fontSize: 12, marginTop: 1 },
  secciones:        { padding: 16, gap: 10 },
  secColBox:        { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#eee' },
  secColBtn:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  secColLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  secColIcono:      { fontSize: 22 },
  secColTitulo:     { fontSize: 15, fontWeight: '700', color: '#1B5E20' },
  secColSub:        { fontSize: 12, color: '#888', marginTop: 2 },
  secColChevron:    { fontSize: 14, color: '#2E7D32' },
  secColContenido:  { paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  vacioBox:         { backgroundColor: '#F1F8E9', borderRadius: 12, padding: 14, marginTop: 14, marginBottom: 4 },
  vacioTexto:       { color: '#2E7D32', fontWeight: '600', fontSize: 14, marginBottom: 4 },
  vacioSub:         { color: '#558B2F', fontSize: 12, lineHeight: 18 },
  vehiculoCard:     { backgroundColor: '#F1F8E9', borderRadius: 12, padding: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehiculoIcono:    { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  placas:           { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
  vehiculoDetalle:  { fontSize: 12, color: '#555', marginTop: 2 },
  vehiculoTipo:     { fontSize: 11, color: '#888', marginTop: 1 },
  editarBtn:        { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#C8E6C9' },
  editarBtnTexto:   { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  divider:          { height: 0.5, backgroundColor: '#eee', marginVertical: 18 },
  subTituloForm:    { fontSize: 14, fontWeight: '700', color: '#1B5E20', marginBottom: 10 },
  instruccionBox:   { backgroundColor: '#F1F8E9', borderRadius: 10, padding: 12, marginBottom: 14 },
  instruccionTexto: { fontSize: 12, color: '#558B2F', lineHeight: 18 },
  inputLabel:       { fontSize: 12, color: '#555', fontWeight: '500', marginBottom: 6 },
  input:            { marginBottom: 12, backgroundColor: '#fff' },
  dropdownBox:      { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff' },
  dropdownTexto:    { fontSize: 14, color: '#1B5E20' },
  dropdownChevron:  { fontSize: 14, color: '#2E7D32' },
  errorBox:         { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 10, marginBottom: 10 },
  errorTexto:       { color: '#C62828', fontSize: 13 },
  okBox:            { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, marginBottom: 10 },
  okTexto:          { color: '#2E7D32', fontSize: 13, fontWeight: '600' },
  boton:            { backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  botonTexto:       { color: '#fff', fontWeight: '600', fontSize: 15 },
  cuentaBox:        { marginHorizontal: 16, marginTop: 6 },
  cuentaTitulo:     { fontSize: 13, fontWeight: '600', color: '#aaa', marginBottom: 10, marginLeft: 4 },
  cerrarBtn:        { borderWidth: 1, borderColor: '#ffcdd2', borderRadius: 14, padding: 14, alignItems: 'center', backgroundColor: '#fff9f9' },
  cerrarTexto:      { color: '#C62828', fontSize: 14, fontWeight: '500' },

  // Modal editar
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox:         { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo:      { fontSize: 18, fontWeight: '700', color: '#1B5E20' },
  
});
