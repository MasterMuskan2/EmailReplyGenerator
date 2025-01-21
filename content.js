console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginLeft = '8px';
    button.style.marginRight = '8px';
    button.style.backgroundColor = '#1a73e8';
    button.style.color = '#fff';
    button.style.border = '1px solid rgba(0, 0, 0, 0.1)';
    button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
    button.style.borderRadius = '4px';
    button.style.padding = '6px 20px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = '500';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply');
    return button;
}

function createToneSelector() {
    const toneSelectorWrapper = document.createElement('div');
    toneSelectorWrapper.style.display = 'flex';
    toneSelectorWrapper.style.alignItems = 'center';

    const toneSelector = document.createElement('select');
    toneSelector.className = 'ai-tone-selector';
    toneSelector.style.marginRight = '8px';
    toneSelector.style.padding = '6px 12px';
    toneSelector.style.fontSize = '14px';
    toneSelector.style.border = '1px solid rgba(0, 0, 0, 0.1)';
    toneSelector.style.borderRadius = '4px';
    toneSelector.style.backgroundColor = '#fff';
    toneSelector.style.color = '#000';
    toneSelector.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
    toneSelector.style.cursor = 'pointer';
    toneSelector.style.fontWeight = '500';

    toneSelector.innerHTML = `
        <option value="professional" style="color: #000;">Professional</option>
        <option value="casual" style="color: #000;">Casual</option>
        <option value="formal" style="color: #000;">Formal</option>
        <option value="friendly" style="color: #000;">Friendly</option>
        <option value="other" style="color: #000;">Other</option>
    `;

    const customToneInput = document.createElement('input');
    customToneInput.className = 'ai-custom-tone-input';
    customToneInput.placeholder = 'Enter custom tone';
    customToneInput.style.display = 'none';
    customToneInput.style.marginLeft = '8px';
    customToneInput.style.padding = '6px';
    customToneInput.style.border = '1px solid rgba(0, 0, 0, 0.1)';
    customToneInput.style.borderRadius = '4px';
    customToneInput.style.width = '200px';
    customToneInput.style.fontSize = '14px';
    customToneInput.style.backgroundColor = '#fff';
    customToneInput.style.color = '#000';
    customToneInput.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';

    toneSelector.onchange = () => {
        customToneInput.style.display = toneSelector.value === 'other' ? 'inline-block' : 'none';
    };

    toneSelectorWrapper.appendChild(toneSelector);
    toneSelectorWrapper.appendChild(customToneInput);

    return toneSelectorWrapper;
}

function getEmailContent() {
    const selectors = ['.h7', '.a3s.aiL', '.gmail_quote', '[role="presentation"]'];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerText.trim();
        }
    }
    return '';
}

function findComposeToolbar() {
    const selectors = ['.btC', '.aDh', '[role="toolbar"]', '.gU.Up'];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }
    return null;
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    const existingToneSelectorWrapper = document.querySelector('.ai-tone-selector-wrapper');
    if (existingButton) existingButton.remove();
    if (existingToneSelectorWrapper) existingToneSelectorWrapper.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) return;

    const button = createAIButton();
    button.classList.add('ai-reply-button');

    const toneSelectorWrapper = createToneSelector();

    button.addEventListener('click', async () => {
        try {
            button.innerHTML = 'Generating...';
            button.disabled = true;

            const emailContent = getEmailContent();
            let selectedTone = toneSelectorWrapper.querySelector('select').value;
            let customTone = toneSelectorWrapper.querySelector('input').value.trim();

            if (selectedTone === 'other') {
                if (!customTone) {
                    alert('Please enter a custom tone.');
                    button.innerHTML = 'AI Reply';
                    button.disabled = false;
                    return;
                }
                selectedTone = customTone;
            }

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: selectedTone
                })
            });

            if (!response.ok) throw new Error('API Request Failed');

            const generatedReply = await response.text();
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');

            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            }
        } catch (error) {
            alert('Failed to generate reply');
        } finally {
            button.innerHTML = 'AI Reply';
            button.disabled = false;
        }
    });

    const toneSelectorContainer = document.createElement('div');
    toneSelectorContainer.classList.add('ai-tone-selector-wrapper');
    toneSelectorContainer.appendChild(toneSelectorWrapper);

    toolbar.insertBefore(button, toolbar.firstChild);
    toolbar.insertBefore(toneSelectorContainer, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) setTimeout(injectButton, 500);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
