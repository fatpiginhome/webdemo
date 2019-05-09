const hummus = require('hummus');

const simpleWatermark= function(filePath, filename){
    let pdfReader = hummus.createReader(filePath)
    let pdfWriter = hummus.createWriterToModify(filePath, {
        modifiedFilePath: `pdfw/${filename}`
    });

    let objCxt = pdfWriter.getObjectsContext();
    let gsId = objCxt.startNewIndirectObject();
    let dict = objCxt.startDictionary();
    dict.writeKey("type");
    dict.writeNameValue("ExtGState");
    dict.writeKey("ca");
    objCxt.writeNumber(0.5);
    objCxt.endLine();
    objCxt.endDictionary(dict);

    let fontCouri = pdfWriter.getFontForFile('simsun.ttc');

    let width = getPageDimensions(pdfWriter, 0).width;
    let height = getPageDimensions(pdfWriter, 0).height;

    let delta = Math.sqrt((width/2 * width/2)/2);
    let x = width/2 - delta;
    let y = height/2 - delta;

    console.log(width, height);
    console.log(x, y);

    let xobjectForm = pdfWriter.createFormXObject(0,0,width,width/2);
    let resourcesDict = xobjectForm.getResourcesDictinary();
    let gsName = resourcesDict.addExtGStateMapping(gsId);

    let company ='';

    xobjectForm.getContentContext()
        .q()
        .gs(gsName)
        .BT() // Begin Text
        .k(0,0,0,1) // Set Color (CMYK, 0-1)
        .Tf(fontCouri,width/6) // Text font? Font & size?
        .Tm(1,0,0,1,0,width/10) // Text Matrix, set to coord 5,20
        .Tj('长春理工大学') // Show text
        .Tf(fontCouri,width/parseInt(company.length * 2/3)) // Text font? Font & size?
        .Tm(1,0,0,1,0,10) // Text Matrix, set to coord 5,5 (to place below previous line)
        .Tj(company) // More text
        .ET() // End Text
        .q() // Push Current Matrix
        .cm(1,0,0,1,0,0) // Set Current Matrix - scale to 100% (x and y), translate 0,35
        .Q();
    pdfWriter.endFormXObject(xobjectForm);

    for(let i=0;i<pdfReader.getPagesCount();++i){
        let pageModifier = new hummus.PDFPageModifier(pdfWriter,i, true);
        var cxt = pageModifier.startContext().getContext();
        cxt.q()
            .cm(1,0,0,1,x, y)
            .cm(Math.cos(Math.PI/4),Math.sin(Math.PI/4),-Math.sin(Math.PI/4),Math.cos(Math.PI/4),0,0)
            .doXObject(xobjectForm)
            .Q();

        pageModifier.endContext().writePage();
    }
    pdfWriter.end();
}


function getPageDimensions(pdfWriter,pageIndex) {
    var pdfParser = pdfWriter.getModifiedFileParser();
    var pageInfo = pdfParser.parsePage(pageIndex);
    var pageMediaBox = pageInfo.getMediaBox();

    return {
        width:pageMediaBox[2]-pageMediaBox[0],
        height:pageMediaBox[3]-pageMediaBox[1]
    };
}

module.exports = simpleWatermark;