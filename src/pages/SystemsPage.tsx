import { Navigate } from 'react-router-dom';

// Página "Sistemas 18/06" aposentada. O conteúdo foi realocado:
// - Provações de Apolo -> Missões e Provações (/missions)
// - Tutoriais -> /tutorials
// - Localização -> Configurações (/settings)
// - Validação técnica -> Executor (/executor/validation)
export function SystemsPage(){
  return <Navigate to="/missions" replace/>;
}
