# Guia — animais, água, oxigênio e Íris Base

## Configuração de cada animal no Planejador

Na ficha do animal, preencha:

- Habilidade principal.
- Interações contextuais.
- Categorias e etiquetas secundárias.
- Velocidade, salto, dano, peso e defesa nas notas de balanceamento.
- Nado de superfície.
- Capacidade de mergulhar como forma terrestre.
- Tempo de oxigênio.
- Se afunda quando não sabe nadar.
- Estilo da curva subaquática.
- Aviso do tutorial.
- Notas específicas de movimento e nado.

## Comportamentos aquáticos

### Animal aquático

- Nada livremente em todas as direções.
- Não depende do oxigênio limitado das formas terrestres.
- Pode receber aceleração, velocidade e curva próprias.

### Animal terrestre que nada apenas na superfície

- `Nado de superfície`: ativo.
- `Mergulho terrestre`: desativado.
- O jogador desloca-se horizontalmente na linha de água.
- Tentar descer não inicia mergulho.

### Animal terrestre que mergulha

- `Nado de superfície`: ativo.
- `Mergulho terrestre`: ativo.
- Configure `Oxigênio em segundos`.
- A mini-HUD surge apenas enquanto a forma está submersa.
- Ao tocar numa Bolha de Ar, o oxigênio é restaurado.
- Ao chegar a zero, o jogador morre e retorna ao último checkpoint.

### Animal que não sabe nadar

- `Nado de superfície`: desativado.
- `Afunda quando não sabe nadar`: ativo.
- A ficha deve marcar o aviso do tutorial.
- A mensagem do animal precisa dizer claramente que ele afunda em água profunda.

## Curva do nado

- **Direto**: muda de direção rapidamente.
- **Arco curto**: faz uma curva leve.
- **Arco longo**: precisa antecipar mudanças; adequado a formas grandes e rápidas.

## Íris Base

Íris Base é tratada como uma forma protegida:

- Apenas anda e pula.
- Pulo mais lento e suave.
- Não pode ser arquivada, apagada ou bloqueada.
- Não aparece como transformação normal depois do Cavalo, exceto quando a narrativa a reativa.
- Quando todas as formas animais ficam temporariamente indisponíveis, o jogo deve voltar para Íris Base.

## Configuração no Unity — referência do backup 18/06 att

Os campos do Planejador devem ser reproduzidos nos assets e componentes correspondentes:

- `AnimalFormData`: propriedades aquáticas da forma.
- `WaterDetector`: entrada, saída e superfície da água.
- `WaterMotor2D`: movimento e curva subaquática.
- `OxygenSystem`: tempo, consumo, HUD e morte.
- `BolhaDeArOxygenPickup`: reposição de oxigênio.
- `FormSwitcher`: bloqueios temporários e fallback.
- `FormLockActions`: bloquear/restaurar formas por eventos.

Sempre teste cada forma em quatro situações: terra, superfície, submersa e queda acidental em água profunda.
