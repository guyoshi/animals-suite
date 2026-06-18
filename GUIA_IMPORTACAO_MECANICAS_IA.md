# Guia — criar e importar mecânicas com IA

## 1. Exportar o contexto

Em **Mecânicas**, clique em **Exportar base para IA**.

O arquivo inclui:

- visão e regras de Animals;
- mundos e áreas;
- animais, categorias e habilidades;
- itens;
- inimigos;
- Actions de NPC;
- mecânicas já cadastradas;
- ideias existentes;
- Provações.

## 2. Instrução recomendada para a IA

Peça que a IA mantenha o mesmo formato JSON e crie mecânicas que:

- combinem com um ou mais mundos;
- usem sistemas existentes sempre que possível;
- expliquem configuração e scripts relacionados;
- evitem repetir nomes existentes;
- indiquem categorias e animais úteis;
- informem se estão apenas planejadas ou já suportadas.

## 3. Formatos aceitos

Lista direta:

```json
[
  {
    "name": "Nome da mecânica",
    "kind": "puzzle",
    "description": "Como funciona"
  }
]
```

Ou objeto:

```json
{
  "mechanics": [
    {
      "name": "Nome da mecânica",
      "kind": "hazard",
      "description": "Como funciona"
    }
  ]
}
```

## 4. Resolver conflitos

Quando o nome já existe:

- a nova mecânica aparece à esquerda;
- a atual aparece à direita;
- **Manter existente** vem selecionado;
- **Substituir** troca os dados;
- **Importar renomeada** preserva ambas.

A escolha segura é manter a atual até confirmar que a versão da IA é realmente melhor.
