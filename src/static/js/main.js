$(document).ready(function() {
    // DOM elements
    const $fileInput = $('#file-input');
    let isAppendUpload = false;
    
    // Initial state
    updateRemoveButtons();
    
    // File upload
    $('#upload-btn').on('click', function() {
        isAppendUpload = false;
        $fileInput.click();
    });

    $('#append-btn').on('click', function() {
        isAppendUpload = true;
        $fileInput.click();
    });

    $fileInput.on('change', function() {
        if (this.files.length) {
            uploadFile(isAppendUpload);
            // reset flag so next direct upload is treated as replace
            isAppendUpload = false;
        }
    });
    
    // Clean function
    window.Clean = function() {
        // Ask server to remove uploaded files
        if (currentFiles && currentFiles.length) {
            const filenames = currentFiles.map(f => f.stored);
            const formData = new FormData();
            formData.append('filenames', JSON.stringify(filenames));
            $.ajax({
                url: '/api/reset',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false
            });
        }

        // Reset client-side state to initial
        currentFiles = [];
        currentFileIndex = 0;
        lastScanResults = null;

        $('.keyword-input').val('');
        $('.counter').text('0').css('background-color', 'var(--pale-gray)');
        $('#file-status').html('');
        $('#scan-summary').text('');
        $('#keyword-error').text('');
        $('#scan-btn').prop('disabled', true);
        $('#text-container').empty();
        $('#doc-indicator').text('');
        $('#doc-selector').empty().addClass('hidden');
        $('#file-list').empty();
        $('#file-input').val(null);
        updateNavButtons();
        renderDocSelector();
        renderFileList();
        updateRemoveButtons();
    };
    
    // Add field (called from HTML onclick)
    window.addField = function() {
        $('#keywords').append(`
            <div class="input-holder">
                <input type="text" class="keyword-input" name="keywords" placeholder="ключевое слово">
                <button class="remove-btn">⛌</button>
                <button class="find-btn">➡️</button>
                <div class="counter">0</div>
            </div>
        `);
        updateRemoveButtons();
        updateScanSummary();
    };
    
    // Dynamic event handlers
    $(document).on('click', '.remove-btn', function(e) {
        if ($('.input-holder').length <= 1) return false;
        $(this).closest('.input-holder').remove();
        updateRemoveButtons();
    });
    
    $(document).on('click', '.find-btn', function() {
        const $inputHolder = $(this).closest('.input-holder');
        const keyword = $inputHolder.find('.keyword-input').val().trim();
        
        if (!keyword) return;
        
        const $targetH4 = $('#text-container').find(`h4:contains("${keyword}")`).first();
        
        if ($targetH4.length) {
            $('#text-container h4').css({'background-color': '', 'color': '', 'padding': '', 'border-radius': ''});
            $('#text-container').animate({scrollTop: $targetH4.position().top - 20}, 400);
            $targetH4.css({
                'background-color': '#007bff', 'color': 'white', 'padding': '10px', 'border-radius': '5px'
            }).animate({'background-color': 'transparent', 'color': ''}, 2000);
        } else {
            $('#text-container').animate({scrollTop: 0}, 500);
        }
    });

    // Keyword input change: update scan summary & validation
    $(document).on('input', '.keyword-input', function() {
        $('#keyword-error').text('');
        updateScanSummary();
    });

    // Enter in keyword input: move focus or trigger scan
    $(document).on('keydown', '.keyword-input', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const $inputs = $('.keyword-input');
            const index = $inputs.index(this);
            if (index === $inputs.length - 1) {
                scanFile();
            } else {
                $inputs.eq(index + 1).focus();
            }
        }
    });

    // Document navigation
    $('#prev-doc').on('click', function() {
        if (!lastScanResults || !currentFiles || currentFiles.length <= 1) return;
        currentFileIndex = (currentFileIndex - 1 + currentFiles.length) % currentFiles.length;
        renderCurrentDocumentResults();
    });

    $('#next-doc').on('click', function() {
        if (!lastScanResults || !currentFiles || currentFiles.length <= 1) return;
        currentFileIndex = (currentFileIndex + 1) % currentFiles.length;
        renderCurrentDocumentResults();
    });

    updateNavButtons();
    renderDocSelector();
    renderFileList();
    updateScanSummary();
});

function renderCurrentDocumentResults() {
    if (!lastScanResults || !currentFiles || currentFiles.length === 0) {
        $('#text-container').html('<p class="no-results">Нет данных для отображения.</p>');
        $('#doc-indicator').text('');
        updateNavButtons();
        return;
    }

    const current = currentFiles[currentFileIndex];
    const resultsForDoc = lastScanResults[current.stored] || {};

    let html = '';
    let hasResults = false;

    $.each(resultsForDoc, function(keyword, paragraphs) {
        if (paragraphs.length > 0) {
            hasResults = true;
            html += `<h4>"${keyword}": <span class="badge">${paragraphs.length} совпадений</span></h4><ul class="results-list">`;
            $.each(paragraphs, function(i, para) {
                html += `<li>${highlightKeywordsInText(para, keyword)}</li>`;
            });
            html += '</ul>';
        }
    });

    if (!hasResults) {
        html += '<p class="no-results">Результаты не найдены.</p>';
    }

    $('#text-container').html(html);
    $('#doc-indicator').text(`Документ ${currentFileIndex + 1} из ${currentFiles.length}: ${current.original}`);
    updateCounters(resultsForDoc);
    updateNavButtons();
    renderDocSelector();
    renderFileList();
}

function updateNavButtons() {
    const hasMultiple = lastScanResults && currentFiles && currentFiles.length > 1;
    if (hasMultiple) {
        $('#prev-doc, #next-doc').prop('disabled', false).removeClass('hidden');
    } else {
        $('#prev-doc, #next-doc').prop('disabled', true).addClass('hidden');
    }
}

function renderDocSelector() {
    const $container = $('#doc-selector');
    $container.empty();

    if (!currentFiles || currentFiles.length <= 1) {
        $container.addClass('hidden');
        return;
    }

    $container.removeClass('hidden');

    $('<span>')
        .addClass('doc-selector-label')
        .text('Документы в списке:')
        .appendTo($container);

    currentFiles.forEach((file, index) => {
        const $btn = $('<button>')
            .attr('type', 'button')
            .addClass('doc-dot')
            .toggleClass('active', index === currentFileIndex)
            .attr('title', file.original)
            .text(index + 1)
            .on('click', function() {
                currentFileIndex = index;
                if (lastScanResults) {
                    renderCurrentDocumentResults();
                } else {
                    $('#doc-indicator').text(`Документ ${currentFileIndex + 1} из ${currentFiles.length}: ${file.original}`);
                    renderDocSelector();
                }
            });

        $container.append($btn);
    });
}

function renderFileList() {
    const $list = $('#file-list');
    $list.empty();

    if (!currentFiles || !currentFiles.length) {
        return;
    }

    const $ul = $('<ul>');

    currentFiles.forEach((file, index) => {
        const $li = $('<li>')
            .toggleClass('active', index === currentFileIndex)
            .text(file.original);
        $ul.append($li);
    });

    $list.append($ul);
}

function countNonEmptyKeywords() {
    let count = 0;
    $('.keyword-input').each(function() {
        if ($(this).val().trim()) {
            count++;
        }
    });
    return count;
}

function updateScanSummary() {
    const docs = currentFiles ? currentFiles.length : 0;
    const keywordsCount = countNonEmptyKeywords();

    if (docs === 0 && keywordsCount === 0) {
        $('#scan-summary').text('');
        $('#scan-btn').prop('disabled', true);
        return;
    }

    $('#scan-summary').text(`Будет обработано документов: ${docs}. Ключевых слов: ${keywordsCount}.`);
    $('#scan-btn').prop('disabled', !(docs > 0 && keywordsCount > 0));
}
