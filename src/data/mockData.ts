export const mockClients = [
  { id: "1", name: "Maria Silva Santos", cpfCnpj: "123.456.789-00", phone: "(11) 99999-1234", email: "maria@email.com", city: "São Paulo", casesCount: 3, status: "active" as const },
  { id: "2", name: "Empresa ABC Ltda", cpfCnpj: "12.345.678/0001-90", phone: "(11) 98888-5678", email: "contato@abc.com", city: "Rio de Janeiro", casesCount: 1, status: "active" as const },
  { id: "3", name: "João Pedro Oliveira", cpfCnpj: "987.654.321-00", phone: "(21) 97777-9012", email: "joao@email.com", city: "Belo Horizonte", casesCount: 2, status: "active" as const },
  { id: "4", name: "Ana Beatriz Costa", cpfCnpj: "456.789.123-00", phone: "(31) 96666-3456", email: "ana@email.com", city: "Curitiba", casesCount: 1, status: "inactive" as const },
  { id: "5", name: "Tech Solutions S.A.", cpfCnpj: "98.765.432/0001-10", phone: "(41) 95555-7890", email: "contato@tech.com", city: "Florianópolis", casesCount: 4, status: "active" as const },
];

export const mockCases = [
  { id: "1", number: "0001234-56.2024.8.26.0100", court: "TJSP - 1ª Vara Cível", type: "Indenização", status: "Em andamento" as const, client: "Maria Silva Santos", responsible: "Dr. Carlos Mendes", createdAt: "2024-01-15" },
  { id: "2", number: "0005678-90.2024.8.19.0001", court: "TJRJ - 3ª Vara Trabalhista", type: "Trabalhista", status: "Aguardando audiência" as const, client: "Empresa ABC Ltda", responsible: "Dra. Patrícia Lima", createdAt: "2024-02-20" },
  { id: "3", number: "0009012-34.2024.8.13.0001", court: "TJMG - 2ª Vara de Família", type: "Família", status: "Em andamento" as const, client: "João Pedro Oliveira", responsible: "Dr. Carlos Mendes", createdAt: "2024-03-10" },
  { id: "4", number: "0003456-78.2024.8.16.0001", court: "TJPR - 5ª Vara Cível", type: "Contratual", status: "Encerrado" as const, client: "Ana Beatriz Costa", responsible: "Dra. Patrícia Lima", createdAt: "2023-11-05" },
  { id: "5", number: "0007890-12.2024.8.24.0001", court: "TJSC - 1ª Vara Criminal", type: "Criminal", status: "Em andamento" as const, client: "Tech Solutions S.A.", responsible: "Dr. Roberto Alves", createdAt: "2024-04-01" },
];

export const mockEvents = [
  { id: "1", title: "Audiência - Maria Silva", date: "2024-03-15", time: "14:00", type: "audiencia" as const, caseNumber: "0001234-56.2024.8.26.0100" },
  { id: "2", title: "Prazo - Contestação ABC", date: "2024-03-18", time: "23:59", type: "prazo" as const, caseNumber: "0005678-90.2024.8.19.0001" },
  { id: "3", title: "Reunião com João Pedro", date: "2024-03-20", time: "10:00", type: "reuniao" as const, caseNumber: "0009012-34.2024.8.13.0001" },
  { id: "4", title: "Prazo - Recurso Tech Solutions", date: "2024-03-22", time: "23:59", type: "prazo" as const, caseNumber: "0007890-12.2024.8.24.0001" },
  { id: "5", title: "Audiência - Tech Solutions", date: "2024-03-25", time: "09:30", type: "audiencia" as const, caseNumber: "0007890-12.2024.8.24.0001" },
];

export const mockPayments = [
  { id: "1", client: "Maria Silva Santos", description: "Honorários advocatícios", amount: 5000, date: "2024-03-01", status: "pago" as const },
  { id: "2", client: "Empresa ABC Ltda", description: "Consultoria jurídica", amount: 12000, date: "2024-03-05", status: "pago" as const },
  { id: "3", client: "João Pedro Oliveira", description: "Honorários - Processo Família", amount: 3500, date: "2024-03-10", status: "pendente" as const },
  { id: "4", client: "Tech Solutions S.A.", description: "Assessoria contratual", amount: 8000, date: "2024-03-15", status: "pendente" as const },
  { id: "5", client: "Ana Beatriz Costa", description: "Honorários finais", amount: 2500, date: "2024-02-28", status: "atrasado" as const },
];

export const mockUsers = [
  { id: "1", name: "Dr. Carlos Mendes", email: "carlos@escritorio.com", role: "administrador" as const, status: "active" as const },
  { id: "2", name: "Dra. Patrícia Lima", email: "patricia@escritorio.com", role: "advogado" as const, status: "active" as const },
  { id: "3", name: "Dr. Roberto Alves", email: "roberto@escritorio.com", role: "advogado" as const, status: "active" as const },
  { id: "4", name: "Juliana Ferreira", email: "juliana@escritorio.com", role: "assistente" as const, status: "active" as const },
  { id: "5", name: "Lucas Martins", email: "lucas@escritorio.com", role: "assistente" as const, status: "inactive" as const },
];
