$(document).ready(function() {
    // DOM elements
    const $fileInput = $('#file-input');
    
    // Initial state
    updateRemoveButtons();
    
    // File upload
    $fileInput.on('change', function() {
        if (this.files.length) {
            originalFilename = this.files[0].name;
            uploadFile();
        }
    });
    
    // Clean function
    window.Clean = function() {
        $('.keyword-input').val('');
        $('.counter').text('0').css('background-color', 'var(--pale-gray)');
        $('#file-status').html(currentFilename ? `✅ <strong>Загружено:</strong> ${originalFilename}` : '');
        $('#scan-btn').prop('disabled', !currentFilename);
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
        
        if (!keyword || !currentFilename) return;
        
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
});
