function uploadFile() {
    const formData = new FormData();
    formData.append('file', $('#file-input')[0].files[0]);
    $('#upload-btn').text('Uploading...').prop('disabled', true);
    $('#file-status').text('Uploading...');
    
    $.ajax({
        url: '/api/upload', type: 'POST', data: formData,
        processData: false, contentType: false,
        success: function(data) {
            if (data.success) {
                currentFilename = data.filename;
                $('#file-status').html(`✅ <strong>Загружено:</strong> ${originalFilename}`);
                $('#scan-btn').prop('disabled', false);
            } else {
                $('#file-status').html(`❌ <strong>Ошибка:</strong> ${data.error}`);
                currentFilename = null; originalFilename = null;
                $('#scan-btn').prop('disabled', true);
                $('.counter').text('0').css('background-color', 'var(--red)');
            }
        },
        error: function() {
            $('#file-status').html('❌ <strong>Ошибка загрузки!</strong>');
            currentFilename = null; originalFilename = null;
            $('#scan-btn').prop('disabled', true);
            $('.counter').text('0').css('background-color', 'var(--red)');
        },
        complete: function() {
            $('#upload-btn').text('📁 Загрузить файл').prop('disabled', false);
        }
    });
}

function updateCounters(results) {
    $('.input-holder').each(function() {
        const $inputHolder = $(this);
        const keyword = $inputHolder.find('.keyword-input').val().trim();
        const $counter = $inputHolder.find('.counter');
        if (keyword && results[keyword]) {
            $counter.css('background-color', results[keyword].length === 0 ? 'var(--pale-gray)' : 'var(--blue)')
                   .text(results[keyword].length);
        } else {
            $counter.css('background-color', 'var(--pale-gray)').text('0');
        }
    });
}

window.scanFile = function() {
    if (!currentFilename) return;
    const formData = new FormData();
    formData.append('filename', currentFilename);
    const keywordsArray = $('.keyword-input').map(function() { return $(this).val(); }).get();
    formData.append('keywords', keywordsArray.join(','));
    
    $('#scan-btn').text('Поиск...').prop('disabled', true);
    $('#text-container').html('<p><em>Обработка документа...</em></p>');
    
    $.ajax({
        url: '/api/scan', type: 'POST', data: formData,
        processData: false, contentType: false,
        success: function(data) {
            if (data.success) {
                let html = ''; let hasResults = false;
                $.each(data.results, function(keyword, paragraphs) {
                    if (paragraphs.length > 0) {
                        hasResults = true;
                        html += `<h4>"${keyword}": <span class="badge">${paragraphs.length} совпадений</span></h4><ul class="results-list">`;
                        $.each(paragraphs, function(i, para) {
                            html += `<li>${highlightKeywordsInText(para, keyword)}</li>`;
                        });
                        html += '</ul>';
                    }
                });
                if (!hasResults) html += '<p class="no-results">Результаты не найдены.</p>';
                $('#text-container').html(html);
                $('#file-status').html(`✅ <strong>Готово:</strong> ${originalFilename}`);
                updateCounters(data.results);
            } else {
                $('#text-container').html(`<p class="error">❌ ${data.error}</p>`);
            }
        },
        error: function() {
            $('#text-container').html('<p class="error">❌ Ошибка поиска!</p>');
        },
        complete: function() {
            $('#scan-btn').text('🔍 Поиск').prop('disabled', false);
        }
    });
};

window.shutdownApp = function() {
    // Fire-and-forget shutdown request; even if connection is cut,
    // the server should still stop, so we just show a friendly message.
    $.ajax({
        url: '/api/shutdown',
        type: 'POST',
        complete: function() {
            $('#file-status').html('✅ <strong>Приложение остановлено. Можете закрыть эту вкладку.</strong>');
        }
    });
};
