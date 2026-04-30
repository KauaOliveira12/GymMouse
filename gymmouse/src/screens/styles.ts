import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // --- ESTILOS DA TELA DE LOGIN ---
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Cor de fundo da tela (cinza bem claro)
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'column',
    gap: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F0F0F0',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001F3F', // Azul escuro do GymMouse
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#FF8C00', // Laranja característico do botão
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    width: '100%',
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
    marginTop: -10,
    marginBottom: 5,
  },

  // --- ESTILOS EXCLUSIVOS DA TELA HOME ---
  homeContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerLogo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  logoCircle: { 
    backgroundColor: '#FFF', 
    width: 35, 
    height: 35, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 10 
  },
  headerTitle: { 
    color: '#FFF', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  headerIcons: { 
    flexDirection: 'row' 
  },
  icon: { 
    marginLeft: 15 
  },
  pageTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#0B2046', 
    margin: 20 
  },
  groupCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  groupCardImage: { 
    width: 70, 
    height: 70, 
    borderRadius: 10 
  },
  groupCardInfo: { 
    flex: 1, 
    marginLeft: 15 
  },
  groupCardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#0B2046', 
    marginBottom: 5 
  },
  groupCardRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 3 
  },
  groupCardText: { 
    fontSize: 13, 
    color: '#666', 
    marginLeft: 5 
  },
  btnSair: { 
    padding: 5 
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#FF8C00',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  // --- ESTILOS DO MODAL (POP-UP) ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#FFF',
    width: '85%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B2046',
  },
  modalCloseBtn: {
    padding: 5,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  modalActionIcon: {
    marginRight: 15,
  },
  modalActionText: {
    fontSize: 16,
    color: '#0B2046',
    fontWeight: '500'
  },
  // --- ESTILOS DA TELA DO GRUPO ---
  grupoHeaderTop: {
    backgroundColor: '#FF8C00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  grupoHeaderTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  grupoCover: {
    backgroundColor: '#1C2026', // Fundo escuro igual ao protótipo
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    height: 120,
  },
  grupoCoverText: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderColor: '#FF8C00',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#0B2046',
    fontWeight: 'bold',
  },
  // Cards de Check-in
  postCard: {
    backgroundColor: '#FFF',
    margin: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  postImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B2046',
  },
  postDesc: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    gap: 15,
  },
  // Cards de Ranking
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  rankCardDestaque: {
    backgroundColor: '#FFF3E0', // Fundo alaranjado para "Você"
    borderColor: '#FF8C00',
    borderWidth: 1,
  },
  rankPos: {
    width: 30,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B2046',
  },
});
