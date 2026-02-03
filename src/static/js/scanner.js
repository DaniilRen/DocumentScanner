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

    window.Clean = function() {
        $('.keyword-input').val('');
        $('.counter').text('0').css('background-color', 'var(--red)');
        
        if (currentFilename) {
            $status.html(`✅ <strong>Загружено:</strong> ${originalFilename}`);
        } else {
            $status.html('');
        }
        
        $scanBtn.prop('disabled', !currentFilename);
    };

    $('.find-btn').on('click', function() {
        const $inputHolder = $(this).closest('.input-holder');
        const keyword = $inputHolder.find('.keyword-input').val().trim();
        
        if (!keyword || !currentFilename) return;
        
        const $targetH4 = $results.find(`h4:contains("${keyword}")`).first();
        
        if ($targetH4.length) {
            $results.find('h4').css({
                'background-color': '',
                'color': '',
                'padding': '',
                'border-radius': ''
            });
            
            $('#text-container').animate({
                scrollTop: $targetH4.position().top - 20
            }, 400);
            
            $targetH4.css({
                'background-color': '#007bff',
                'color': 'white',
                'padding': '10px',
                'border-radius': '5px'
            }).animate({
                'background-color': 'transparent',
                'color': ''
            }, 2000);
        } else {
            $('#text-container').animate({
                scrollTop: 0
            }, 500);
        }
    });

    function getWordForms(keyword) {
        const forms = [keyword.toLowerCase()];
        const base = keyword.slice(0, -1).toLowerCase();
        const lastChar = keyword.slice(-1).toLowerCase();
        
        const endings = {
            'а': ['а', 'ы', 'е', 'у', 'ой', 'ом'],
            'я': ['я', 'и', 'е', 'ю', 'ей', 'ем'],
            'ь': ['ь', 'и', 'и', 'ю', 'ью', 'ем'],
            'о': ['о', 'а', 'у', 'ом', 'е'],
            'е': ['е', 'я', 'ю', 'ем', 'е']
        };
        
        if (endings[lastChar]) {
            endings[lastChar].forEach(ending => {
                if (ending !== lastChar) {
                    forms.push(base + ending);
                }
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
                    $status.html(`❌ <strong>Ошибка:</strong> ${data.error}`);
                    currentFilename = null;
                    originalFilename = null;
                    $scanBtn.prop('disabled', true);
                    $('.counter').text('0').css('background-color', 'var(--red)');
                }
            },
            error: function() {
                $status.html('❌ <strong>Ошибка загрузки!</strong>');
                currentFilename = null;
                originalFilename = null;
                $scanBtn.prop('disabled', true);
                $('.counter').text('0').css('background-color', 'var(--red)');
            },
            complete: function() {
                $uploadBtn.text('📁 Загрузить файл').prop('disabled', false);
            }
        });
    }
    
    function updateCounters(results) {
        $('.input-holder').each(function() {
            const $inputHolder = $(this);
            const keyword = $inputHolder.find('.keyword-input').val().trim();
            const $counter = $inputHolder.find('.counter');
            
            if (keyword && results[keyword]) {
                if (results[keyword].length === 0) {
                    $counter.css('background-color', 'var(--red)')
                } else {
                    $counter.css('background-color', 'var(--light-green)')
                }
                $counter.text(results[keyword].length);
            } else {
                $counter.css('background-color', 'var(--red)')
                $counter.text('0');
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
        
        $scanBtn.text('Поиск...').prop('disabled', true);
        $results.html('<p><em>Обработка документа...</em></p>');
        
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
                            html += `<h4>"${keyword}": <span class="badge">${paragraphs.length} совпадений</span></h4>`;
                            html += '<ul class="results-list">';
                            
                            $.each(paragraphs, function(i, para) {
                                // HIGHLIGHT ONLY TARGET KEYWORD - NO INTERSECTION
                                html += `<li>${highlightKeywordsInText(para, keyword)}</li>`;
                            });
                            html += '</ul>';
                        }
                    });
                    
                    if (!hasResults) {
                        html += '<p class="no-results">Результаты не найдены.</p>';
                    }
                    
                    $results.html(html);
                    $status.html(`✅ <strong>Готово:</strong> ${originalFilename}`);
                    updateCounters(data.results);
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
