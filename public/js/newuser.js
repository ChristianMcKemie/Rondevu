$(document).ready(function () {

    if (window.location.hash && window.location.hash == '#_=_') {
        if (window.history && history.pushState) {
            window.history.pushState("", document.title, window.location.pathname);
        } else {
// Prevent scrolling by storing the page's current scroll offset
            var scroll = {
                top: document.body.scrollTop,
                left: document.body.scrollLeft
            };
            window.location.hash = '';
            // Restore the scroll offset, should be flicker free
            document.body.scrollTop = scroll.top;
            document.body.scrollLeft = scroll.left;
        }
    }

    $.post("/loadsettings", "load", loadSettings);




});



function loadSettings(data, status) {
    if (status !== "success" || data === "unauth" || data === "notfound") {
        //window.location.replace('/logout');
        console.log(data + " " + status);
        //return;
    }

    var interestslider = document.getElementById('interest-slider');
    var ageslider = document.getElementById('age-slider');
    var distanceslider = document.getElementById('distance-slider');
    var loadpref;
    switch (data.preference) {
        case "males":
            loadpref = 1;
            break;
        case "both":
            loadpref = 2;
            break;
        case "females":
            loadpref = 3;
            break;
            defualt:
                    loadpref = 2;
    }
    noUiSlider.create(interestslider, {
        start: [loadpref],
        step: 1,
        padding: 0,
        format: {
            to: function (value) {

                var interest = Math.round(parseInt(value));
                if (interest === 1) {
                    interest = "males";
                }
                if (interest === 2) {
                    interest = "both";
                }
                if (interest === 3) {
                    interest = "females";
                }
                return interest;
            },
            from: function (value) {
                return value;
            }
        },
        tooltips: true,
        connect: true,
        range: {
            'min': 1,
            'max': 3
        }
    });
    noUiSlider.create(ageslider, {

        start: [data.age_range.low, data.age_range.high],
        step: 1,
        format: {
            to: function (value) {
                return Math.round(parseInt(value));
            },
            from: function (value) {
                return value;
            }
        },
        tooltips: true,
        connect: true,
        range: {
            'min': 18,
            'max': 100
        }
    });
    noUiSlider.create(distanceslider, {
        start: [data.distance],
        step: 1,
        padding: 5,
        format: {
            to: function (value) {
                return (Math.round(parseInt(value)) + " miles");
            },
            from: function (value) {
                return value;
            }
        },
        tooltips: true,
        connect: true,
        range: {
            'min': 0,
            'max': 105
        }
    });
    var settingssubmit = document.getElementById("settings-submit");
    var settingswindow = document.getElementById("settingswindow");
    settingssubmit.onclick = function () {
        savesettings();
    };
    settingswindow = document.getElementById('settingswindow');
    var origins = settingswindow.getElementsByClassName('noUi-base');
    origins[0].classList.add("interest-slider");
    origins = settingswindow.getElementsByClassName('noUi-connect');
    console.log(origins);
    origins[0].classList.add("age-slider");
    settingswindow.classList.remove('hide');
    return true;
}
function savesettings() {
    var settingswindow = document.getElementById('settingswindow');
    var interestslider = document.getElementById('interest-slider');
    var ageslider = document.getElementById('age-slider');
    var distanceslider = document.getElementById('distance-slider');
    var settingssubmit = document.getElementById("settings-submit");
    var loading = document.getElementById("loading");
    var matchshow = document.getElementById("matchshow");
    var findmatcheswindow = document.getElementById("findmatcheswindow");
    var distance = distanceslider.noUiSlider.get();
    distance = distance.replace(" miles", "");
    var low = ageslider.noUiSlider.get()[0];
    var high = ageslider.noUiSlider.get()[1];
    var zipinput = document.getElementById("zipinput");
    var savedata = {preference: interestslider.noUiSlider.get(),
        age_range: {low: low, high: high},
        distance: distance,
        zip: zipinput.value};
    $.post("/savesettingsnew", savedata, function (data, status) {
        console.log(data);
        if (data === "invZip") {

            $("#zipinput").css("border", "3px solid red");
            $("#zipinput").attr("placeholder", " Invalid")
            setTimeout(function () {
                $("#zipinput").attr("placeholder", "ZipCode")
                $("#zipinput").css("border", "");
            }, 900);



        }
        if (data === "success") {
            settingswindow.classList.add('hide');
            $.post("/loadprofileedit", "load", loadprofileedit);
        }
    }
    );
}

function loadprofileedit(data, status) {
    if (status !== "success" || data === "unauth" || data === "notfound") {
        window.location.replace('/logout');
        return;
    }
    var usersloginid = data.id;
    var pic1 = document.getElementById('pic1');
    var pic2 = document.getElementById('pic2');
    var pic3 = document.getElementById('pic3');
    var pic4 = document.getElementById('pic4');
    var pic5 = document.getElementById('pic5');
    var pic6 = document.getElementById('pic6');
    var about = document.getElementById('about');
    var education = document.getElementById('education');
    var profileeditwindow = document.getElementById("profileeditwindow");
    var profileeditsubmit = document.getElementById('profileedit-submit');
    about.addEventListener('keydown', autosize);
    if (data.about === null) {
        about.innerHTML = "";
    } else {
        about.innerHTML = data.about;
    }
    if (data.education === null) {
        education.innerHTML = "";
    } else {
        education.innerHTML = data.education;
    }
    profileeditsubmit.onclick = function () {
        saveprofile(true);
    };

    pic1.setAttribute("content", data.pictures.pic1);
    pic2.setAttribute("content", data.pictures.pic2);
    pic3.setAttribute("content", data.pictures.pic3);
    pic4.setAttribute("content", data.pictures.pic4);
    pic5.setAttribute("content", data.pictures.pic5);
    pic6.setAttribute("content", data.pictures.pic6);
    pic1.setAttribute("isNull", data.pictures.isNull1);
    pic2.setAttribute("isNull", data.pictures.isNull2);
    pic3.setAttribute("isNull", data.pictures.isNull3);
    pic4.setAttribute("isNull", data.pictures.isNull4);
    pic5.setAttribute("isNull", data.pictures.isNull5);
    pic6.setAttribute("isNull", data.pictures.isNull6);
    if (data.pictures.isNull1 === false) {
        pic1.style.backgroundImage = "url('/images/null.jpg')";
    } else {
        pic1.style.backgroundImage = "url('/images/" + usersloginid + "/" + data.pictures.pic1 + ".jpg')";
    }
    if (data.pictures.isNull2 === false) {
        pic2.style.backgroundImage = "url('/images/null.jpg')";
    } else {
        pic2.style.backgroundImage = "url('/images/" + usersloginid + "/" + data.pictures.pic2 + ".jpg')";
    }
    if (data.pictures.isNull3 === false) {
        pic3.style.backgroundImage = "url('/images/null.jpg')";
    } else {
        pic3.style.backgroundImage = "url('/images/" + usersloginid + "/" + data.pictures.pic3 + ".jpg')";
    }
    if (data.pictures.isNull4 === false) {
        pic4.style.backgroundImage = "url('/images/null.jpg')";
    } else {
        pic4.style.backgroundImage = "url('/images/" + usersloginid + "/" + data.pictures.pic4 + ".jpg')";
    }
    if (data.pictures.isNull5 === false) {
        pic5.style.backgroundImage = "url('/images/null.jpg')";
    } else {
        pic5.style.backgroundImage = "url('/images/" + usersloginid + "/" + data.pictures.pic5 + ".jpg')";
    }
    if (data.pictures.isNull6 === false) {
        pic6.style.backgroundImage = "url('/images/null.jpg')";
    } else {
        pic6.style.backgroundImage = "url('/images/" + usersloginid + "/" + data.pictures.pic6 + ".jpg')";
    }
    var firstpic;
    var secondpicBGI;
    var secondpiccontent;
    var secondpicisNull;
    var firstpicisNull;
    var removePic = document.getElementById("removePic");
    var addPic = document.getElementById("addPic");
    var add;
    $('#pictureframe').off();
    $('#pictureframe').on('click', '.picswap', function () {
        if (!firstpic) {
            firstpic = $(this);
            firstpic.addClass('picswapSelect');
            firstpic.parent().css("border", "3px solid rgb(208, 72, 163)");
            firstpicisNull = firstpic.attr('isNull');
            if (firstpicisNull === "false") {
                addPic.classList.remove('hide');
                add = true;
            } else {
                removePic.classList.remove('hide');
                add = false;
            }
        } else {

            if (firstpic.attr('isNull') !== false || $(this).attr('isNull') !== false) {
                if (add === true) {
                    addPic.classList.add('hide');
                } else {
                    removePic.classList.add('hide');
                }


//$(this).attr('isNull', firstpic.attr('isNull'));

                secondpicBGI = $(this).css('background-image');
                $(this).css('background-image', firstpic.css('background-image'));
                firstpic.css('background-image', secondpicBGI);
                secondpiccontent = $(this).attr('content');
                $(this).attr('content', firstpic.attr('content'));
                firstpic.attr('content', secondpiccontent);
                secondpicisNull = $(this).attr('isNull');
                $(this).attr('isNull', firstpic.attr('isNull'));
                firstpic.attr('isNull', secondpicisNull);
                firstpic.removeClass('picswapSelect');
                firstpic.parent().css("border", "");
                firstpic = null;
            } else {
                if ($(this).attr('order') === firstpic.attr('order')) {
                    firstpic.removeClass('picswapSelect');
                    firstpic.parent().css("border", "");
                    firstpic = null;
                } else {
                    firstpic.removeClass('picswapSelect');
                    firstpic.parent().css("border", "");
                    firstpic = $(this);
                    firstpic.addClass('picswapSelect');
                    firstpic.parent().css("border", "3px solid rgb(208, 72, 163)");
                }
            }
        }
    });
    $('#removePic').click(function () {
        var selected = $(".picswapSelect");
        var content = selected.attr('content');
        var picorder = selected.attr('order');
        $.post("/removepic", {piccontent: content, picorder: picorder}, function (data, status) {
            if (data === "success") {
                firstpic.removeClass('picswapSelect');
                firstpic.parent().css("border", "");
                selected.css('background-image', "url('images/null.jpg')");
                selected.css('border', "");
                firstpic.attr('isNull', false);
                firstpic = null;
                $('#removePic').addClass('hide');
            }
        });
    });
    $('#addPic').click(function () {
        var html = "";
        $.post("/getfbpics", null, function (data, status) {
            if (status === "success") {
                var selected = $(".picswapSelect");
                var content = selected.attr('content');
                var order = selected.attr('order');
                var partsOfStr = data.split(',');
                var u = 0;
                for (var i = 0; i <= partsOfStr.length; i++) {
                    if (i + 1 === partsOfStr.length) {
                        break;
                    }
                    html += '<div class="lbimg" picid="' + partsOfStr[i + u] + '" style="background-image:url(' + partsOfStr[i + u + 1] + ');"></div>';
                    u = u + 1;
                }
                $('#lightbox').removeClass('hide');
                $('#lightbox').attr('type', 'addpics');
                $('#lbAddPics').removeClass('hide');
                $('#lbAddPics').html(html);
                $('#lbAddPics').off();
                $('#lbAddPics').on('click', '.lbimg', function () {
                    var that = $(this);
                    $.post("/savenewfbpic", {picid: $(this).attr('picid'), order: order, content: content}, function (data) {
                        if (data === 'success') {
                            var selected = $(".picswapSelect");
                            selected.attr('isNull', true);
                            selected.attr('content', order);
                            $('#lightbox').addClass('hide');
                            $('#lightbox').attr('type', '');
                            $('#lbAddPics').addClass('hide');
                            $('#lbAddPics').html("");
                            //console.log($(this)[0]);
                            selected.css('background-image', that.css("background-image"));
                            $('#addPic').addClass('hide');
                            //$('#removePic').removeClass('hide');
                            selected.parent().css('border', "");
                            selected.removeClass('picswapSelect');
                            selected = null;
                            firstpic = null;
                            addPic.classList.add('hide');
                        }
                    });
                });
            }
        });
    });

    profileeditwindow.classList.remove('hide');
    return true;
}



function saveprofile(btnChange) {
    var pics = document.getElementsByClassName('picswap');
    var aboutvalue = document.getElementById('about').value;
    var savedata = {about: aboutvalue,
        pic1: [pics[0].getAttribute('order'), cast(pics[0].getAttribute('content')), cast(pics[0].getAttribute('isNull'))],
        pic2: [pics[1].getAttribute('order'), cast(pics[1].getAttribute('content')), cast(pics[1].getAttribute('isNull'))],
        pic3: [pics[2].getAttribute('order'), cast(pics[2].getAttribute('content')), cast(pics[2].getAttribute('isNull'))],
        pic4: [pics[3].getAttribute('order'), cast(pics[3].getAttribute('content')), cast(pics[3].getAttribute('isNull'))],
        pic5: [pics[4].getAttribute('order'), cast(pics[4].getAttribute('content')), cast(pics[4].getAttribute('isNull'))],
        pic6: [pics[5].getAttribute('order'), cast(pics[5].getAttribute('content')), cast(pics[5].getAttribute('isNull'))]};
    $.post("/saveprofile", savedata, function (data) {
        if (data === "success" && btnChange === true) {
            var profileeditsubmit = document.getElementById('profileedit-submit');
            profileeditsubmit.innerHTML = data;
            profileeditsubmit.style.backgroundColor = "#4CAF50";
            setTimeout(function () {
                window.location.replace('/home');
            }, 500);
        }
    });
}

function cast(value) {
    var v = Number(value);
    return !isNaN(v) ? v :
            value === "undefined" ? undefined
            : value === "null" ? null
            : value === "true" ? true
            : value === "false" ? false
            : value;
}

function autosize() {
    var el = this;
    setTimeout(function () {
        el.style.cssText = 'height:60px; padding:0';
        if (el.scrollHeight < 60) {
            var height = el.scrollHeight + 60;
        } else {
            var height = el.scrollHeight + 30;
        }
        el.style.cssText = 'height:' + height + 'px';
    }, 0);
}
