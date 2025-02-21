// document.getElementById('gerarPDF').addEventListener('click', function() {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();

//     html2canvas(document.querySelector("form")).then(canvas => {
//         const imgData = canvas.toDataURL("image/png");
//         doc.addImage(imgData, 'PNG', 10, 10, 180, 0);
//         doc.save("ficha_anamnese.pdf");
//     });
// });
document.getElementById('gerarPDF').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Seleciona o formulário (sem o botão) e usa html2canvas para convertê-lo em imagem
    html2canvas(document.querySelector("form")).then(canvas => {
        // Converte a imagem do formulário para um formato que o jsPDF possa utilizar
        const imgData = canvas.toDataURL("image/png");

        // Adiciona a imagem no PDF, ajustando o tamanho e a posição
        const margin = 10; // Margem da página
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 2 * margin;  // Ajuste para caber na largura da página
        const imgHeight = canvas.height * imgWidth / canvas.width; // Calcula a altura da imagem com base na largura

        // Verifica se a altura da imagem ultrapassa o tamanho da página e, caso necessário, cria uma nova página
        if (imgHeight > pageHeight - 2 * margin) {
            doc.addImage(imgData, 'PNG', margin, margin, imgWidth, (pageHeight - 2 * margin));
            doc.addPage();
            doc.addImage(imgData, 'PNG', margin, margin, imgWidth, (imgHeight - (pageHeight - 2 * margin)));
        } else {
            doc.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        }

        // Salva o PDF gerado
        doc.save("ficha_anamnese.pdf");
    });
});
