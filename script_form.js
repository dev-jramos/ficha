document.addEventListener('DOMContentLoaded', function () {
    // Elementos do DOM
    const form = document.getElementById('form-anamnese');
    const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');
    const salvarPDFBtn = document.getElementById('salvarPDF');
    const contatoInput = document.getElementById('contato');
    const cpfInput = document.getElementById('cpf');
    const dataAssinaturaInput = document.getElementById('data_assinatura');
    const logoImg = document.getElementById('logoImg');

    // Verifica se os elementos existem antes de manipulá-los
    if (!form || !salvarPDFBtn) {
        console.error('Elementos do DOM não encontrados.');
        return;
    }

    // Mostrar/ocultar campos de detalhes quando checkboxes são marcados
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const detailsId = `${this.id}-details`;
            const detailsField = document.getElementById(detailsId);

            if (detailsField) {
                detailsField.classList.toggle('hidden', !this.checked);
            }
        });
    });

    // Validação do formulário
    function validateForm() {
        const requiredFields = form.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                valid = false;
            } else {
                field.classList.remove('error');
            }
        });

        return valid;
    }

    // Formatação de data para o formato brasileiro
    function formatDate(dateInput) {
        if (!dateInput) return "";

        const date = new Date(dateInput);
        return date.toLocaleDateString('pt-BR');
    }

    // Botão para gerar o preview do PDF
    salvarPDFBtn.addEventListener('click', function () {
        if (!validateForm()) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Cria o contêiner de preview dinamicamente
        const previewContainer = document.createElement('div');
        previewContainer.id = 'preview-container';
        previewContainer.classList.add('preview-container');

        const previewHeader = document.createElement('div');
        previewHeader.classList.add('preview-header');
        previewHeader.innerHTML = `
            <h3>Visualização do PDF</h3>
            <button id="close-preview" class="btn-secondary close-x"><i class="fas fa-times"></i></button>
        `;

        const pdfPreview = document.createElement('div');
        pdfPreview.id = 'pdf-preview';

        const previewActions = document.createElement('div');
        previewActions.classList.add('preview-actions');
        previewActions.innerHTML = `
            <button id="confirm-pdf" class="btn-primary">Confirmar e Baixar</button>
            <button id="edit-form" class="btn-secondary">Voltar e Editar</button>
        `;

        previewContainer.appendChild(previewHeader);
        previewContainer.appendChild(pdfPreview);
        previewContainer.appendChild(previewActions);

        // Adiciona o preview ao body
        document.body.appendChild(previewContainer);

        // Clona o formulário para o preview
        const formClone = form.cloneNode(true);
        formClone.classList.add('preview-form');

        // Remove botões do clone
        const buttons = formClone.querySelectorAll('button');
        buttons.forEach(button => button.remove());

        // Desabilita checkboxes e radios no clone
        const checkboxesInClone = formClone.querySelectorAll('input[type="checkbox"]');
        checkboxesInClone.forEach(checkbox => checkbox.disabled = true);

        const radiosInClone = formClone.querySelectorAll('input[type="radio"]');
        radiosInClone.forEach(radio => radio.disabled = true);

        // Formata a data de assinatura no preview
        const dataField = formClone.querySelector('#data_assinatura');
        if (dataField && dataField.value) {
            const dataFormatada = formatDate(dataField.value);
            const dataSpan = document.createElement('span');
            dataSpan.textContent = dataFormatada;
            dataField.parentNode.replaceChild(dataSpan, dataField);
        }

        // Remove o campo de assinatura do preview e substitui por uma linha
        const signatureContainer = formClone.querySelector('.signature-field');
        if (signatureContainer) {
            signatureContainer.innerHTML = `
                <label for="assinatura">Assinatura do Paciente:</label>
                <div class="signature-line">
                    <hr style="border-top: 1px solid #000; margin: 30px 0 10px 0;">
                    <p style="text-align: center; font-style: italic;">Assinar após impressão</p>
                </div>
            `;
        }

        // Limpa o preview e adiciona o clone do formulário
        pdfPreview.innerHTML = '';
        pdfPreview.appendChild(formClone);

        // Configura eventos para os botões do preview
        const closePreviewBtn = document.getElementById('close-preview');
        const confirmPDFBtn = document.getElementById('confirm-pdf');
        const editFormBtn = document.getElementById('edit-form');

        if (closePreviewBtn && confirmPDFBtn && editFormBtn) {
            closePreviewBtn.addEventListener('click', function () {
                previewContainer.remove();
            });

            editFormBtn.addEventListener('click', function () {
                previewContainer.remove();
            });

            confirmPDFBtn.addEventListener('click', function () {
                try {
                    const { jsPDF } = window.jspdf;
                    if (!jsPDF) {
                        throw new Error("jsPDF não está disponível");
                    }

                    const doc = new jsPDF('p', 'mm', 'a4');

                    // Captura o conteúdo do preview
                    const element = pdfPreview.firstElementChild;

                    // Configurações para o html2canvas
                    const options = {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        allowTaint: true
                    };

                    // Converte o conteúdo para imagem e gera o PDF
                    html2canvas(element, options).then(canvas => {
                        const imgData = canvas.toDataURL('image/png');
                        const imgWidth = 210; // Largura do A4 em mm
                        const pageHeight = 297; // Altura do A4 em mm
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        let heightLeft = imgHeight;
                        let position = 0;

                        // Adiciona a primeira página
                        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;

                        // Adiciona páginas adicionais, se necessário
                        while (heightLeft >= 0) {
                            position = heightLeft - imgHeight;
                            doc.addPage();
                            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;
                        }

                        // Nome do arquivo PDF
                        const nome = document.getElementById('nome').value || 'paciente';
                        const dataAtual = new Date().toISOString().slice(0, 10);
                        const nomeArquivo = `ficha_anamnese_${nome.replace(/\s+/g, '_')}_${dataAtual}.pdf`;

                        // Salva o PDF
                        doc.save(nomeArquivo);

                        // Remove o preview
                        previewContainer.remove();
                    }).catch(error => {
                        console.error('Erro ao gerar o PDF:', error);
                        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
                        previewContainer.remove();
                    });
                } catch (error) {
                    console.error('Erro ao inicializar o PDF:', error);
                    alert('Ocorreu um erro ao preparar o PDF. Verifique se todas as bibliotecas estão carregadas corretamente.');
                    previewContainer.remove();
                }
            });
        }
    });

    // Máscara para telefone
    if (contatoInput) {
        contatoInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length > 0) {
                if (value.length <= 2) {
                    value = `(${value}`;
                } else if (value.length <= 7) {
                    value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
                } else if (value.length <= 11) {
                    value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
                } else {
                    value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7, 11)}`;
                }
            }

            e.target.value = value;
        });
    }

    // Máscara para CPF
    if (cpfInput) {
        cpfInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length > 0) {
                if (value.length <= 3) {
                    // Nada a fazer
                } else if (value.length <= 6) {
                    value = `${value.substring(0, 3)}.${value.substring(3)}`;
                } else if (value.length <= 9) {
                    value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
                } else {
                    value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9, 11)}`;
                }
            }

            e.target.value = value;
        });
    }

    // Preencher data atual no campo de assinatura
    if (dataAssinaturaInput) {
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10); // YYYY-MM-DD
        dataAssinaturaInput.value = formattedDate;
    }

    // Verificar se a imagem do logo existe e carregar um logo padrão se não existir
    if (logoImg) {
        logoImg.onerror = function () {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMTIwIDEyMCI+PHJlY3Qgd2lkdGg9IjEyMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNlNmIwYWEiLz48dGV4dCB4PSI2MCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+UHNpY290ZXJhcGlhPGJyLz5JbnRlZ3JhdGl2YTwvdGV4dD48L3N2Zz4=';
            this.onerror = null; // Prevenir loop infinito
        };
    }
});

// Função para verificar campos obrigatórios em tempo real
function validarCamposEmTempoReal() {
    const requiredFields = document.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.classList.add('error');
                
                // Criar mensagem de erro se não existir
                let errorMsg = this.nextElementSibling;
                if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                    errorMsg = document.createElement('div');
                    errorMsg.classList.add('error-message');
                    errorMsg.textContent = 'Este campo é obrigatório';
                    this.parentNode.insertBefore(errorMsg, this.nextSibling);
                }
            } else {
                this.classList.remove('error');
                
                // Remover mensagem de erro se existir
                const errorMsg = this.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.remove();
                }
            }
        });
    });
}

// Iniciar validação em tempo real
validarCamposEmTempoReal();