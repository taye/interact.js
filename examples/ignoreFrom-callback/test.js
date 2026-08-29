// Test simple pour vérifier que la nouvelle fonctionnalité compile
// et fonctionne avec la syntaxe JavaScript moderne

// Simuler un environnement interactjs
const interact = require('../../packages/interactjs/index.ts');

// Test 1: Usage avec string (fonctionnalité existante)
const configWithString = {
    ignoreFrom: '.ignore-class',
    listeners: {
        move: (event) => console.log('move')
    }
};

// Test 2: Usage avec fonction callback (nouvelle fonctionnalité)
const configWithCallback = {
    ignoreFrom: function(targetNode, eventTarget) {
        // Logique personnalisée
        if (eventTarget instanceof Element) {
            return eventTarget.hasAttribute('data-ignore');
        }
        return false;
    },
    listeners: {
        move: (event) => console.log('callback move')
    }
};

// Test 3: Usage avec fonction callback plus complexe
const configWithComplexCallback = {
    ignoreFrom: (targetNode, eventTarget) => {
        if (eventTarget instanceof Element) {
            // Ignorer les inputs
            if (eventTarget.tagName === 'INPUT' || eventTarget.tagName === 'TEXTAREA') {
                return true;
            }
            
            // Ignorer si parent a classe 'no-drag'
            let parent = eventTarget.parentElement;
            while (parent && parent !== targetNode) {
                if (parent.classList && parent.classList.contains('no-drag')) {
                    return true;
                }
                parent = parent.parentElement;
            }
        }
        return false;
    }
};

console.log('Configurations créées avec succès:');
console.log('- Config avec string:', typeof configWithString.ignoreFrom);
console.log('- Config avec callback:', typeof configWithCallback.ignoreFrom);
console.log('- Config avec callback complexe:', typeof configWithComplexCallback.ignoreFrom);

module.exports = {
    configWithString,
    configWithCallback,
    configWithComplexCallback
};