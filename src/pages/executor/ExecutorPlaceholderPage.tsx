import { Construction } from 'lucide-react';
import { Card, PageHeader } from '../../components/Ui';

export function ExecutorPlaceholderPage({title,description}:{title:string;description:string}){
  return <div><PageHeader title={title} subtitle={description}/><Card><div className="executor-placeholder"><Construction/><strong>Estrutura reservada</strong><p>Esta seção será preenchida durante a migração do guia na Etapa 2. A fundação, as rotas e o armazenamento já estão preparados.</p></div></Card></div>;
}
