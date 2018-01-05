$(document).ready(function () {

    // $('#reportedusersbutton').click(function () {});
    $.post("/getreports", null, function (reportData) {
        console.log(reportData);
        var i = 0;
        var j = 0;

        var count = Object.keys(reportData[i]).length;
        var profilecount = Object.keys(reportData).length;
        $('#reportpic').attr('src', "images/" + reportData[i][0].profileIdReported + "/1.jpg");
        $('#matchpic2').attr('src', "images/" + reportData[i][0].profileIdReported + "/2.jpg");
        $('#matchpic3').attr('src', "images/" + reportData[i][0].profileIdReported + "/3.jpg");
        $('#matchpic4').attr('src', "images/" + reportData[i][0].profileIdReported + "/4.jpg");
        $('#matchpic5').attr('src', "images/" + reportData[i][0].profileIdReported + "/5.jpg");
        $('#matchpic6').attr('src', "images/" + reportData[i][0].profileIdReported + "/6.jpg");
        var category = getcategory(reportData[i][0].category);
        $('#ban').attr('profid', reportData[i][0].profileIdReported);
        $('#reportabout').html(1 + "/" + count + '<br>' + reportData[i][0].profileIdReported + "<br>" + category + '<br>' + reportData[i][0].disc);




        $('.fa-chevron-right').click(function () {
            if (i + 1 < profilecount) {
                i++;
                count = Object.keys(reportData[i]).length;
                $('#reportpic').attr('src', "images/" + reportData[i][0].profileIdReported + "/1.jpg");
                $('#matchpic2').attr('src', "images/" + reportData[i][0].profileIdReported + "/2.jpg");
                $('#matchpic3').attr('src', "images/" + reportData[i][0].profileIdReported + "/3.jpg");
                $('#matchpic4').attr('src', "images/" + reportData[i][0].profileIdReported + "/4.jpg");
                $('#matchpic5').attr('src', "images/" + reportData[i][0].profileIdReported + "/5.jpg");
                $('#matchpic6').attr('src', "images/" + reportData[i][0].profileIdReported + "/6.jpg");
                var category = getcategory(reportData[i][0].category);
                $('#ban').attr('profid', reportData[i][0].profileIdReported);
                $('#reportabout').html(1 + "/" + count + '<br>' + reportData[i][0].profileIdReported + "<br>" + category + '<br>' + reportData[i][0].disc);
            }
        });

        $('.fa-chevron-left').click(function () {
            if (i !== 0) {
                i--;
                count = Object.keys(reportData[i]).length;
                console.log(count);
                $('#reportpic').attr('src', "images/" + reportData[i][0].profileIdReported + "/1.jpg");
                $('#matchpic2').attr('src', "images/" + reportData[i][0].profileIdReported + "/2.jpg");
                $('#matchpic3').attr('src', "images/" + reportData[i][0].profileIdReported + "/3.jpg");
                $('#matchpic4').attr('src', "images/" + reportData[i][0].profileIdReported + "/4.jpg");
                $('#matchpic5').attr('src', "images/" + reportData[i][0].profileIdReported + "/5.jpg");
                $('#matchpic6').attr('src', "images/" + reportData[i][0].profileIdReported + "/6.jpg");
                var category = getcategory(reportData[i][0].category);
                $('#ban').attr('profid', reportData[i][0].profileIdReported);
                $('#reportabout').html(1 + "/" + count + '<br>' + reportData[i][0].profileIdReported + "<br>" + category + '<br>' + reportData[i][0].disc);
            }
        });

        $('.fa-sort-desc').click(function () {
            if (j + 1 < count) {
                j++;
                $('#reportpic').attr('src', "images/" + reportData[i][j].profileIdReported + "/1.jpg");
                $('#matchpic2').attr('src', "images/" + reportData[i][j].profileIdReported + "/2.jpg");
                $('#matchpic3').attr('src', "images/" + reportData[i][j].profileIdReported + "/3.jpg");
                $('#matchpic4').attr('src', "images/" + reportData[i][j].profileIdReported + "/4.jpg");
                $('#matchpic5').attr('src', "images/" + reportData[i][j].profileIdReported + "/5.jpg");
                $('#matchpic6').attr('src', "images/" + reportData[i][j].profileIdReported + "/6.jpg");
                var category = getcategory(reportData[i][0].category);
                $('#reportabout').html(j + 1 + "/" + count + '<br>' + reportData[i][j].profileIdReported + "<br>" + category + '<br>' + reportData[i][j].disc);
            }
        });


        $('.fa-sort-asc').click(function () {
            if (j !== 0) {
                j--;
                $('#reportpic').attr('src', "images/" + reportData[i][j].profileIdReported + "/1.jpg");
                $('#matchpic2').attr('src', "images/" + reportData[i][j].profileIdReported + "/2.jpg");
                $('#matchpic3').attr('src', "images/" + reportData[i][j].profileIdReported + "/3.jpg");
                $('#matchpic4').attr('src', "images/" + reportData[i][j].profileIdReported + "/4.jpg");
                $('#matchpic5').attr('src', "images/" + reportData[i][j].profileIdReported + "/5.jpg");
                $('#matchpic6').attr('src', "images/" + reportData[i][j].profileIdReported + "/6.jpg");
                var category = getcategory(reportData[i][0].category);
                $('#reportabout').html(j + 1 + "/" + count + '<br>' + reportData[i][j].profileIdReported + "<br>" + category + '<br>' + reportData[i][j].disc);

            }
        });


        $('#ban').click(function () {
            $.post("/ban", {id: $('#ban').attr('profid')}, function (reportData) {
                if (reportData === "success") {
                    $('#ban').css("color", "#4CAF50");
                    setTimeout(function () {
                        $('#ban').css("color", "");
                    }, 1234);

                }
            });
        });
    });

});


function getcategory(category) {

    switch (category) {
        case '1':
            return "Inappropriate Content";
            break;
        case '2':
            return "Spam or Bot";
            break;
        case '3':
            return "Account Misrepresentation (Catfish)";
            break;
        case '4':
            return "Ulterior Motives";
            break;
        case '5':
            return "Harassment";
            break;
    }

}