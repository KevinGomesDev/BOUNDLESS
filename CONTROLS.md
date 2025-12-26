# 🎮 Controles do Mapa-Mundi

## Navegação da Câmera

### 🖱️ **Mouse**

| Ação               | Controle                             | Descrição                                  |
| ------------------ | ------------------------------------ | ------------------------------------------ |
| **Pan (Arrastar)** | Botão Esquerdo ou Direito + Arrastar | Move o mapa livremente em qualquer direção |
| **Zoom In**        | Roda do Mouse para Cima              | Aproxima o mapa (até 4x)                   |
| **Zoom Out**       | Roda do Mouse para Baixo             | Afasta o mapa (até 30% - vista completa)   |

### ⌨️ **Teclado**

| Tecla          | Ação                                               |
| -------------- | -------------------------------------------------- |
| **W** ou **↑** | Move câmera para cima                              |
| **S** ou **↓** | Move câmera para baixo                             |
| **A** ou **←** | Move câmera para esquerda                          |
| **D** ou **→** | Move câmera para direita                           |
| **HOME**       | Reseta para vista completa do mapa (animado)       |
| **C**          | Abre modal de combate (com território selecionado) |

---

## Interação com Territórios

### 🗺️ **Seleção**

| Ação               | Controle                      | Resultado                               |
| ------------------ | ----------------------------- | --------------------------------------- |
| **Hover**          | Passar mouse sobre território | Exibe borda branca + tooltip na TopBar  |
| **Clique Simples** | Botão Esquerdo (sem arrastar) | Seleciona território (borda dourada)    |
| **Duplo Clique**   | Clicar 2x no mesmo território | Abre TerritoryModal com grade hexagonal |

### 📋 **Detecção Inteligente**

O sistema diferencia automaticamente entre:

- **Clique:** `pointerup` no mesmo local do `pointerdown` (≤5px de movimento)
- **Drag:** Movimento > 5px é considerado pan da câmera e NÃO dispara seleção

---

## Comportamento por Contexto

### 🎯 **Mapa Principal (GameScene)**

- ✅ Todos os controles ativos
- ✅ Hover mostra tooltip
- ✅ Clique seleciona territórios
- ✅ Pan com qualquer botão do mouse
- ✅ WASD/Setas movem câmera

### 🪟 **Modal Aberto (TerritoryModal/CombatModal)**

- ❌ Controles de câmera desabilitados
- ❌ Hover/clique no mapa ignorados
- ✅ Modal tem sua própria interação
- ✅ Clicar no backdrop (fundo preto) fecha modal

---

## Dicas de Uso

### 💡 **Navegação Eficiente**

1. **Exploração Rápida:** Use WASD/Setas para scan contínuo do mapa
2. **Posicionamento Preciso:** Arraste com mouse para ajustar vista
3. **Zoom Estratégico:** Zoom in para detalhes, zoom out para visão geral
4. **Combinação:** Zoom + Pan = Foco cirúrgico em áreas específicas

### 🎨 **Feedback Visual**

| Estado          | Indicador                                     |
| --------------- | --------------------------------------------- |
| **Hover**       | Borda branca (2px) + Cursor pointer           |
| **Selecionado** | Borda dourada (4px) + Preenchimento 15% opaco |
| **Arrastando**  | Cursor `grabbing`                             |
| **Padrão**      | Cursor `default`                              |

### 🚫 **Limitações**

- **Territórios de Água:** Exibem tooltip mas não são selecionáveis
- **Limites do Mapa:** Câmera não pode sair da área 2000×1600px
- **Zoom Mínimo:** Calculado dinamicamente para evitar bordas pretas
- **Drag durante Hover:** Interação pausada enquanto arrasta

---

## Configurações Avançadas

### 🔧 **Ajustes no Código**

Personalize em [`CameraController.js`](client/src/worldmap/camera/CameraController.js):

```javascript
// Velocidade de movimento com teclado
this.keyboardSpeed = 300; // Pixels por segundo

// Threshold de drag
this.dragThreshold = 5; // Pixels mínimos para considerar drag

// Limites de zoom
this.minZoom = calculado; // Cobrir tela sem bordas
this.maxZoom = 4.0; // Zoom máximo
```

---

## Troubleshooting

### ⚠️ "Clique não funciona após arrastar"

**Causa:** Sistema detectou drag e bloqueou clique (comportamento correto)  
**Solução:** Solte o botão sem mover o mouse para clique limpo

### ⚠️ "WASD não move câmera"

**Causa:** Modal está aberto ou cena não está focada  
**Solução:** Feche modais e clique na janela do jogo

### ⚠️ "Bordas pretas aparecem"

**Causa:** Zoom out excessivo ou tela maior que mapa  
**Solução:** `minZoom` é recalculado automaticamente no resize

---

## Atalhos Rápidos

| Combinação                    | Ação                                            |
| ----------------------------- | ----------------------------------------------- |
| **Botão Esquerdo + Arrastar** | Pan livre                                       |
| **Botão Direito + Arrastar**  | Pan livre (mesma função)                        |
| **Shift + WASD**              | _(Não implementado - futuro: pan acelerado)_    |
| **Space + Arrastar**          | _(Não implementado - futuro: pan temporário)_   |
| **Ctrl + Roda**               | _(Não implementado - futuro: zoom mais rápido)_ |

---

**Última atualização:** Dezembro 2025  
**Versão:** 2.0 - Controles Melhorados ✨
