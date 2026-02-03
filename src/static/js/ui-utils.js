function updateRemoveButtons() {
    const totalInputs = $('.input-holder').length;
    $('.remove-btn').each(function() {
        const $btn = $(this);
        if (totalInputs <= 1) {
            $btn.css({'opacity': '0.5', 'cursor': 'not-allowed', 'pointer-events': 'none'});
        } else {
            $btn.css({'opacity': '1', 'cursor': 'pointer', 'pointer-events': 'auto'});
        }
    });
}

function getWordForms(keyword) {
    const forms = [keyword.toLowerCase()];
    const base = keyword.slice(0, -1).toLowerCase();
    const lastChar = keyword.slice(-1).toLowerCase();
    const endings = {
        'а': ['а', 'ы', 'е', 'у', 'ой', 'ом'], 'я': ['я', 'и', 'е', 'ю', 'ей', 'ем'],
        'ь': ['ь', 'и', 'и', 'ю', 'ью', 'ем'], 'о': ['о', 'а', 'у', 'ом', 'е'],
        'е': ['е', 'я', 'ю', 'ем', 'е']
    };
    if (endings[lastChar]) {
        endings[lastChar].forEach(ending => {
            if (ending !== lastChar) forms.push(base + ending);
        });
    }
    return forms;
}

function highlightKeywordsInText(text, targetKeyword) {
    let highlighted = text;
    const targetForms = getWordForms(targetKeyword);
    targetForms.forEach(form => {
        if (form.trim()) {
            const regex = new RegExp(`(${form})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark class="highlight">$1</mark>');
        }
    });
    return highlighted;
}
