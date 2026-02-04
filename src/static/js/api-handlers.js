function uploadFile(isAppend) {
    const formData = new FormData();
    const files = $('#file-input')[0].files;

    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    $('#upload-btn').text('Uploading...').prop('disabled', true);
    $('#file-status').text('Uploading...');
    
    $.ajax({
        url: '/api/upload', type: 'POST', data: formData,
        processData: false, contentType: false,
        success: function(data) {
            if (data.success && Array.isArray(data.files) && data.files.length > 0) {
                if (isAppend && currentFiles && currentFiles.length) {
                    currentFiles = currentFiles.concat(data.files);
                } else {
                    currentFiles = data.files;
                    currentFileIndex = 0;
                }

                lastScanResults = null;
                $('#text-container').empty();
                $('#doc-indicator').text('');

                if (currentFiles.length === 1) {
                    $('#file-status').html(`✅ <strong>Загружен файл:</strong> ${currentFiles[0].original}`);
                } else {
                    const namesPreview = currentFiles
                        .slice(0, 2)
                        .map(f => f.original)
                        .join(', ');
                    const more = currentFiles.length > 2 ? ` и ещё ${currentFiles.length - 2}` : '';
                    $('#file-status').html(`✅ <strong>Загружено файлов:</strong> ${currentFiles.length} (${namesPreview}${more})`);
                }

                renderDocSelector();
                renderFileList();
                updateNavButtons();
                updateScanSummary();
            } else {
                $('#file-status').html(`❌ <strong>Ошибка:</strong> ${data.error || 'Не удалось загрузить файлы'}`);
                // Keep existing files if append failed; only clear if there were none
                if (!currentFiles || !currentFiles.length) {
                    $('.counter').text('0').css('background-color', 'var(--red)');
                    $('#text-container').empty();
                    $('#doc-indicator').text('');
                    $('#doc-selector').empty().addClass('hidden');
                    lastScanResults = null;
                    renderFileList();
                    updateNavButtons();
                    updateScanSummary();
                }
            }
        },
        error: function() {
            $('#file-status').html('❌ <strong>Ошибка загрузки!</strong>');
            if (!currentFiles || !currentFiles.length) {
                currentFiles = [];
                currentFileIndex = 0;
                lastScanResults = null;
                $('.counter').text('0').css('background-color', 'var(--red)');
                $('#text-container').empty();
                $('#doc-indicator').text('');
                $('#doc-selector').empty().addClass('hidden');
                renderFileList();
                updateNavButtons();
                updateScanSummary();
            }
        },
        complete: function() {
            $('#upload-btn').text('📁 Загрузить файлы').prop('disabled', false);
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
    if (!currentFiles || currentFiles.length === 0) {
        $('#file-status').html('❌ <strong>Нет загруженных файлов.</strong>');
        return;
    }
    const formData = new FormData();
    const filenames = currentFiles.map(f => f.stored);
    formData.append('filenames', JSON.stringify(filenames));
    const keywordsArray = $('.keyword-input').map(function() { return $(this).val().trim(); }).get();
    const nonEmptyKeywords = keywordsArray.filter(k => k);
    if (nonEmptyKeywords.length === 0) {
        $('#keyword-error').text('Введите хотя бы одно ключевое слово.');
        updateScanSummary();
        return;
    }
    $('#keyword-error').text('');
    formData.append('keywords', nonEmptyKeywords.join(','));
    
    $('#scan-btn').text('Поиск...').prop('disabled', true);
    $('#text-container').html('<p><em>Обработка документа...</em></p>');
    
    $.ajax({
        url: '/api/scan', type: 'POST', data: formData,
        processData: false, contentType: false,
        success: function(data) {
            if (data.success && data.results) {
                lastScanResults = data.results;
                renderCurrentDocumentResults();
            } else {
                $('#text-container').html(`<p class="error">❌ ${data.error || 'Ошибка обработки документов'}</p>`);
                lastScanResults = null;
                updateNavButtons();
            }
        },
        error: function() {
            $('#text-container').html('<p class="error">❌ Ошибка поиска!</p>');
            lastScanResults = null;
            updateNavButtons();
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
