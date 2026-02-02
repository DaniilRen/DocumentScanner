let currentFilename = null;
let originalFilename = null;

$(document).ready(function() {
    const $fileInput = $('#file-input');
    const $uploadBtn = $('#upload-btn');
    const $scanBtn = $('#scan-btn');
    const $status = $('#file-status');
    const $results = $('#text-container');
    
    $fileInput.on('change', function() {
        if (this.files.length) {
            originalFilename = this.files[0].name;
            uploadFile();
        }
    });
    
    function uploadFile() {
        const formData = new FormData();
        formData.append('file', $fileInput[0].files[0]);
        
        $uploadBtn.text('Uploading...').prop('disabled', true);
        $status.text('Uploading...');
        
        $.ajax({
            url: '/api/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.success) {
                    currentFilename = data.filename;
                    $status.html(`✅ <strong>Загружено:</strong> ${originalFilename}`);
                    $scanBtn.prop('disabled', false);
                } else {
                    $status.html(`❌ <strong>Error:</strong> ${data.error}`);
                    currentFilename = null;
                    originalFilename = null;
                    $scanBtn.prop('disabled', true);
                }
            },
            error: function() {
                $status.html('❌ <strong>Ошибка загрузки!</strong>');
                currentFilename = null;
                originalFilename = null;
                $scanBtn.prop('disabled', true);
            },
            complete: function() {
                $uploadBtn.text('📁 Загрузить файл').prop('disabled', false);
            }
        });
    }
    
    window.scanFile = function() {
        if (!currentFilename) return;
        
        const formData = new FormData();
        formData.append('filename', currentFilename);
        const keywordsArray = $('.keyword-input').map(function() {
            return $(this).val();
        }).get();

        formData.append('keywords', keywordsArray.join(','));

        
        $scanBtn.text('Scanning...').prop('disabled', true);
        $results.html('<p><em>Processing document...</em></p>');
        
        $.ajax({
            url: '/api/scan',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.success) {
                    let html = '';
                    let hasResults = false;
                    
                    $.each(data.results, function(keyword, paragraphs) {
                        if (paragraphs.length > 0) {
                            hasResults = true;
                            html += `<h4>"${keyword}": <span class="badge">${paragraphs.length} matches</span></h4>`;
                            html += '<ul class="results-list">';
                            $.each(paragraphs, function(i, para) {
                                html += `<li>${para}</li>`;
                            });
                            html += '</ul>';
                        }
                    });
                    
                    if (!hasResults) {
                        html += '<p class="no-results">No keywords found in document.</p>';
                    }
                    
                    $results.html(html);
                    $status.html(`✅ <strong>Готово:</strong> ${originalFilename}`);
                } else {
                    $results.html(`<p class="error">❌ ${data.error}</p>`);
                }
            },
            error: function() {
                $results.html('<p class="error">❌ Ошибка поиска!</p>');
            },
            complete: function() {
                $scanBtn.text('🔍 Поиск').prop('disabled', false);
            }
        });
    }
});
