

exports.getImg = function (uri, foldername, filename, callback) {

    var fs = require('fs'),
            request = require('request');
    request.head(uri, function (err, res, body) {
        //console.log('content-type:', res.headers['content-type']);
        //console.log('content-length:', res.headers['content-length']);

        if (!fs.existsSync(foldername)) {
            fs.mkdirSync(foldername);
        }

        request(uri).pipe(fs.createWriteStream(foldername + "/" + filename)).on('close', callback);
    });
};


exports.deleteUserPictureFolder = function (ronid, callback) {

    var fs = require('fs');
    path = 'public/images/' + ronid;
    if (fs.existsSync(path)) {
        console.log("found path");
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);

    }
     callback('success');
};

exports.deleteSingleFile = function (path, callback) {
    var fs = require('fs');
    fs.stat(path, function (err, stat) {
        if (err === null) {
            fs.unlinkSync(path);
            callback('success');
        } else{
            console.log(err);
            if (err.code === 'ENOENT') {
            callback('success');
        }
    }
    });
};
exports.parseCSV = function (str, callback) {
    // console.log(str);
    var arr = [];
    var quote = false; // true means we're inside a quoted field

    // iterate over each character, keep track of current row and column (of the returned array)
    for (var row = col = c = 0; c < str.length; c++) {
        var cc = str[c], nc = str[c + 1]; // current character, next character
        arr[row] = arr[row] || []; // create a new row if necessary
        arr[row][col] = arr[row][col] || ''; // create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') {
            arr[row][col] += cc;
            ++c;
            continue;
        }

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') {
            quote = !quote;
            continue;
        }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) {
            ++col;
            continue;
        }

        // If it's a newline and we're not in a quoted field, move on to the next
        // row and move to column 0 of that new row
        if (cc == '\n' && !quote) {
            ++row;
            col = 0;
            continue;
        }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }
    callback(arr);
}


exports.readTextFile = function (file, callback)
{
    var fs = require('fs'), filename = file;
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err) {
            throw err;
        }
        //console.log('OK: ' + filename);
        callback(data);
    });
}