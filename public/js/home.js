$(document).ready(function () {
    if (window.location.hash && window.location.hash == '#_=_') {
        if (window.history && history.pushState) {
            window.history.pushState("", document.title, window.location.pathname);
        } else {
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
    setInterval(function () {
        $(".notifications").fadeOut("slow");
    }, 6000);
    var toomanycalls = 0;
    setInterval(function () {
        toomanycalls = 0;
    }, 60000);
    var refresh = document.getElementById('refresh');
    var loading = document.getElementById("loading");
    var name = document.getElementById('name');
    var settings = document.getElementById("settings");
    var profileedit = document.getElementById("profileedit");
    var settingswindow = document.getElementById("settingswindow");
    var profileeditwindow = document.getElementById("profileeditwindow");
    var chatmessages = document.getElementById("chat-messages");
    //var socket = io('https://dev.therondevu.com');
    socket.on('connect', function () {
        socket.emit('con', usersloginid, function (data) {
        });
    });
    socket.on("private", function (data) {
        switch (Object.keys(data)[0]) {
            case "msg":

                data = data["msg"];
                var abreviatedMsg = data.msg;
                if (abreviatedMsg.length > 12) {
                    abreviatedMsg = abreviatedMsg.substring(0, 12) + "...";
                }
                var chatwindow = document.getElementById("chatwindow");

                var rightmatch = $('.chat[matchprofileid=' + data.from + ']');
                var spanmissedchats = rightmatch.find('.missedchatscount');
                var spanmissedmessage = rightmatch.find('.missedmessage');

                spanmissedmessage.html(abreviatedMsg);
                if (data.from === chatmessages.getAttribute('messageprofileid')) {
                    if (chatwindow.classList.contains("hide") === true) { //add notification if chat is hidden
                        var numchatmissed = parseInt(spanmissedchats.html()) + 1;
                        spanmissedchats.html(numchatmissed);
                        spanmissedchats.removeClass("hide");
                    }
                    chatmessages.insertAdjacentHTML('beforeend', '<div class="chat-message"><div class="sender pull-left messageprofile"><div class="img-circle pointer"><img src="images/' + data.from + '/' + data.pic1 + '.jpg" alt=""></div><div class="time">' + timeSince(Date.now()) + '</div></div><div class="chat-message-body"><span class="left-arrow"></span><div class="text">' + data.msg + '</div></div></div>');
                } else {
                    var numchatmissed = parseInt(spanmissedchats.html()) + 1;
                    spanmissedchats.html(numchatmissed);
                    spanmissedchats.removeClass("hide");
                }

                chatmessages.scrollTop = chatmessages.scrollHeight;
                $("#chat-messages").slimscroll({scroll: chatmessages.scrollHeight});
                break;
            case "match":
                data = data["match"];
                var noMatches = document.getElementById("no-matches");
                if (document.contains(noMatches)) {
                    noMatches.remove();
                }
                addToMatchList(data.from, data.name, data.isNull1, data.online);
                break;
            case "call":
                toomanycalls++;
                if (toomanycalls <= 4) {
                    data = data["call"];
                    $('#lightbox').attr('type', 'call');
                    $('#callboxdiv').attr('matchprofileid', data._id);
                    $('#callboxdiv').attr('name', data.name);
                    $('#answerRejectText').html('Incoming Video Call From ' + data.name);
                    $('.inccallboximg').attr('src', 'images/' + data._id + '/' + data.pictures.pic1 + '.jpg');
                    $('#lightbox').removeClass('hide');
                    $('#videocallyes').removeClass('hide');
                    $('#lb-Inc-Callbox').removeClass('hide');
                }
                break;
            case "reject":
                data = data["reject"];
                $('#lightbox').addClass('hide');
                $('#videocallyes').addClass('hide');
                $('#lb-Inc-Callbox').addClass('hide');
                var answerreject = document.getElementById("answerreject");
                if (answerreject !== null) {
                    answerreject.innerHTML = "Video Chat Declined";
                    setTimeout(function () {
                        $('#lightbox').addClass('hide');
                        $('#lb-Inc-Callbox').addClass('hide');
                    }, 1000);
                }
                break;
            case "answer":
                data = data["answer"];
                window.location.replace('/' + data.from);
                break;
            case "con":
                data = data["con"];
                console.log(data);
                $(".online[matchprofileid = " + data + "]").removeClass('hide');
                $(".videocall[matchprofileid = " + data + "]").removeClass('hide');
                break;
            case "dis":
                data = data["dis"];
                console.log(data);
                $(".online[matchprofileid = " + data + "]").addClass('hide');
                $(".videocall[matchprofileid = " + data + "]").addClass('hide');
                break;
            case "ranhistreq":
                data = data["ranhistreq"];
                console.log(data);
                var ranHist = $(".ranHistory[matchprofileid = " + data + "]");
                console.log(ranHist);
                ranHist.css('border', '3px solid #56bc76');
                ronAlert(ranHist.attr('name') + " has Requested to Match", 5500);
                break;
        }
        ;
    });
    $.post("/loadfindmatches", "load", loadFindMatches);
    var loadSettingsValue = false;

    $('#randomMatchHistory').on('click', '.ranHistory', function () {
        $('#lightbox').removeClass('hide');
        $('#lightbox').attr('type', 'lbAddRandom');
        $('#lbAddRandom').attr('matchprofileid', $(this).attr('matchprofileid'));
        $('#lbAddRandom').removeClass('hide');
    });

    $('.ran-report').click(function () {
        $('#lbAddRandom').addClass('hide');
        var currentdropdownid = $(this).parent().parent().attr('matchprofileid');
        console.log(currentdropdownid);
        $('#lightbox').removeClass('hide');
        $('#lightbox').attr('type', 'reportaccount');
        $('#reportsubmit').attr('reportid', currentdropdownid);
        $('#reportsubmit').attr('morr', 'random');
        $('#lbReport').removeClass('hide');
    });

    $('.ran-matchreq').click(function () {
        $('#lbAddRandom').addClass('hide');
        $('#lightbox').addClass('hide');
        var currentdropdownid = $(this).parent().parent().attr('matchprofileid');
        var RtnObj = {userId: currentdropdownid, like: true};
        $.post("/sortmatchesranreq", RtnObj, function (data) {
            //console.log(data);
            if (data.match === true) {
                var noMatches = document.getElementById("no-matches");
                if (document.contains(noMatches)) {
                    noMatches.remove();
                }
                addToMatchList(currentdropdownid, data.matchdata.name, data.isNull1, data.online);
                socket.emit('match', {to: data.matchdata.profileId, from: usersloginid, name: data.matchdata.name});
            } else {
                socket.emit('ranhistreq', {to: currentdropdownid, from: usersloginid});
                ronAlert("Request Sent", 5500);
            }

        });




    });


    settings.onclick = function () {
        profileeditwindow.classList.add('hide');
        if (loadSettingsValue === false) {
            loadSettingsValue = $.post("/loadsettings", "load", loadSettings);
        } else {
            settingswindow.classList.toggle('hide');
            window.scrollTo(0, document.body.scrollHeight);
        }
    };
    var loadProfileeditValue = false;
    profileedit.onclick = function () {
        window.scrollTo(0, document.body.scrollHeight);
        settingswindow.classList.add('hide');
        if (loadProfileeditValue === false) {
            loadProfileeditValue = $.post("/loadprofileedit", "load", loadprofileedit);
        } else {
            profileeditwindow.classList.toggle('hide');
            window.scrollTo(0, document.body.scrollHeight);
        }
    };
    $('.closesection').click(function () {
        $(this).parents('section.widget').addClass('hide');
    });
    $('.lbclosesection').click(function () {
        $('#lightbox').addClass('hide');
        $('#lightbox').attr('type', '');
        $('#profilelightbox').addClass('hide');
    });
    $('body').on('click', '#lightbox', function () {


        var lightboxAttr = $('#lightbox').attr('type');
        $('#lightbox').addClass('hide');
        $('#' + lightboxAttr).addClass('hide');

        if ($('#lightbox').attr('type') !== 'call') {
            // $('#lightbox').addClass('hide');
        }
        if ($('#lightbox').attr('type') === 'lbReport') {
            $('.matchdrop').addClass('hide');
        }

        if ($('#lightbox').attr('type') === 'unmatch') {
            $('.matchdrop').addClass('hide');
        }
        $('#lightbox').attr('type', '');

    });
    $('#match-list').on('click', '.img-circle', function () {
        var profileId = $(this).attr('matchprofileid');
        profilelightbox(profileId);
    });
    $('#matchshow').on('click', '#refresh', function () {
        refresh.classList.add('hide');
        loading.classList.remove('hide');
        name.innerHTML = "searching...";
        setTimeout(function () {
            $.post("/loadfindmatches", "load", loadFindMatches);
        }, 1200);
    });
    $('.delete-no').click(function () {
        $('#lightbox').addClass('hide');
        $('#lightbox').attr('type', '');
        $('#lbDeleteAccount').addClass('hide');
    });
    $('.delete-yes').click(function () {
        $.post("/deleteaccount", null, function () {
            window.location.replace('/logout');
        });
    });
    var dropdown = null;
    var dropdownid = null;

    $('#randomfilter').click(function () {
        if ($("#randomfilterdropdown").hasClass('hide') === true) {
            $("#randomfilterdropdown").removeClass('hide');
        } else {
            $("#randomfilterdropdown").addClass('hide');
        }
    });
    $('#randomfilterdropdown').on('click', '.ranfilter', function () {
        $(this).toggleClass('ranFilterSelected');
    });
    $('#match-list').on('click', '.rrdroparrow', function () {
        var currentdropdownid = $(this).attr('matchprofileid');
        if (dropdown !== null) {
            if (currentdropdownid === dropdownid) {
                $(this).next().removeClass('hide');
            } else {
                dropdown.addClass('hide');
                $(this).next().removeClass('hide');
            }
        } else {
            $(this).next().removeClass('hide');
        }
        dropdownid = $(this).attr('matchprofileid');
        dropdown = $(this).next();
    });
    $('#match-list').on('click', '.report', function () {
        var currentdropdownid = $(this).parent().prev().attr('matchprofileid');
        console.log(currentdropdownid);
        $('#lightbox').removeClass('hide');
        $('#lightbox').attr('type', 'lbReport');
        $('#reportsubmit').attr('reportid', currentdropdownid);
        $('#reportsubmit').attr('morr', 'match');
        $('#lbReport').removeClass('hide');
    });
    var prevReportOp = null;
    $('#lbReport').on('click', '.reportOp', function () {
        if (prevReportOp !== null) {
            prevReportOp.removeClass('reportOpSelected');
        } else {
            $('#reportsubmit').removeAttr("disabled");
        }
        $(this).addClass('reportOpSelected');
        prevReportOp = $(this);
        $('#lightbox').removeClass('hide');
        $('#lightbox').attr('type', 'reportaccount');
        $('#lbReport').removeClass('hide');
    });
    $('#reportsubmit').click(function () {
        $.post("/reportuser", {id: $(this).attr('reportid'), category: $('.reportOpSelected').attr("position"), disc: $('#reportDisc').val(), morr: $('#reportsubmit').attr('morr')}, function (data, status) {
            if (data === "success") {

                var reportsubmit = document.getElementById('reportsubmit');
                reportsubmit.innerHTML = data;
                reportsubmit.style.backgroundColor = "#4CAF50";
                reportsubmit.style.color = "white";
                setTimeout(function () {
                    reportsubmit.innerHTML = "submit";
                    reportsubmit.style.backgroundColor = "";
                    reportsubmit.style.color = "";
                    $('#lightbox').addClass('hide');
                    $('#lightbox').attr('type', '');
                    $('#lbReport').addClass('hide');
                    dropdown.addClass('hide');
                }, 1234);
            }
        });
    });
    $('#match-list').on('click', '.unmatch', function () {
        var name = $(this).parent().parent().prev().attr("name");
        console.log(name);
        $('#lbUnmatch').prepend("Are you sure you wish to unmatch with " + name + "?");
        $('#lbUnmatch').attr('userid', $(this).parent().prev().attr('matchprofileid'));
        $('#lightbox').removeClass('hide');
        $('#lightbox').attr('type', 'lbUnmatch');
        $('#lbUnmatch').removeClass('hide');
    });
    $('.unmatch-no').click(function () {
        $('#lightbox').addClass('hide');
        $('#lightbox').attr('type', '');
        $('#lbUnmatch').addClass('hide');
        $('.matchdrop').addClass('hide');
    });
    $('.unmatch-yes').click(function () {
        $.post("/unmatchuser", {id: $('#lbUnmatch').attr('userid')}, function (data, status) {
            if (data === "success") {
                $('#lightbox').addClass('hide');
                $('#lightbox').attr('type', '');
                $('#lbUnmatch').addClass('hide');
                $('.matchdrop').addClass('hide');
                $(".img-circle[matchprofileid=" + $('#lbUnmatch').attr('userid') + "]").parent().remove();
                if ($('#match-list li').length === 0) {
                    $('#match-list').html('<li id="no-matches"><div style="text-align:center">No Matches</div></li>');
                }
            }
        });
    });
    var lastchatclicked = "";
    $('#match-list').on('click', '.chat', function () {
        var profileId = $(this).attr('matchprofileid');
        var profilename = $(this).attr('name');
        var rightmatch = $('.chat[matchprofileid=' + profileId + ']');
        var spanmissedchats = rightmatch.find('.missedchatscount')
        spanmissedchats.html("0");
        spanmissedchats.addClass("hide");

        if (lastchatclicked !== profileId) {
            loadchatwindow(profileId, usersloginid, profilename, usersloginname, socket);
        } else {
            var chatwindow = document.getElementById("chatwindow");
            if (chatwindow.classList.contains("hide")) {
                chatwindow.classList.remove('hide');
                chatmessages.scrollTop = chatmessages.scrollHeight;
                $("#chat-messages").slimscroll({scroll: chatmessages.scrollHeight});
            }
        }
        lastchatclicked = profileId;
    });
    var onecallattime = false;
    $('#match-list').on('click', '.videocall', function () {
        if (onecallattime === false) {
            onecallattime === true;
            var profileId = $(this).attr('matchprofileid');
            var profilename = $(this).attr('name');
            $('#lightbox').attr('type', 'call');
            $('#callboxdiv').attr('matchprofileid', profileId);
            $('#callboxdiv').attr('name', profilename);
            $('#lightbox').removeClass('hide');
            $('#answerRejectText').html('Video Calling ' + profilename);
            $('#lb-Inc-Callbox').removeClass('hide');
            $('.inccallboximg').attr('src', 'images/' + profileId + '/' + $(this).attr('pic1') + '.jpg');
            socket.emit('call', {to: profileId, from: usersloginid, name: profilename});
        }
    });
    $('#videocallno').click(function () {
        var profileId = $(this).parent().attr('matchprofileid');
        var profilename = $(this).parent().attr('name');
        socket.emit('reject', {to: profileId, from: usersloginid, name: profilename});
        $('#lightbox').addClass('hide');
        $('#lb-Inc-Callbox').addClass('hide');
    });
    $('#videocallyes').click(function () {
        var profileId = $(this).parent().attr('matchprofileid');
        var profilename = $(this).parent().attr('name');
        socket.emit('answer', {to: profileId, from: usersloginid, name: profilename});
        window.location.replace('/' + usersloginid);
    });
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
                saveprofile(false);
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

        $('#lbFacebookorImport').removeClass('hide');
        $('#lightbox').removeClass('hide');
        $('#lightbox').attr('type', 'lbFacebookorImport');
    });






    var $uploadCrop;

    function readFile(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                //$('.upload-demo').addClass('ready');
                $uploadCrop.croppie('bind', {
                    url: e.target.result
                }).then(function () {
                    console.log('jQuery bind complete');
                });
            };

            reader.readAsDataURL(input.files[0]);
        } else {
            console.log("Sorry - you're browser doesn't support the FileReader API");
        }
    }
    $('#upload').on('change', function () {
        $uploadCrop = $('#UploadaddPic').croppie({
            viewport: {
                width: 200,
                height: 200,
                type: 'square'
            },
            boundary: {
                width: 500,
                height: 500
            },
            enableExif: true
        });

        $('#lbFacebookorImport').addClass('hide');
        $('#lbUploadaddPic').removeClass('hide');

        readFile(this);
    });
    $('.upload-result').on('click', function () {
        $uploadCrop.croppie('result', {
            type: 'canvas',
            size: 'viewport',
            format: 'jpeg'
        }).then(function (resp) {
            $('#UploadaddPic').croppie('destroy');

            var content = {place: $(".picswapSelect").attr('content'),
                order: $(".picswapSelect").attr('order'),
                image: resp};

            $.post("/postimage", content, function (data, status) {

                if (status === "success") {
                    var selected = $(".picswapSelect");
                    $('#lbUploadaddPic').addClass('hide');
                    $('#lightbox').addClass('hide');
                    selected.css('background-image', "");
                    selected.css('background-image', 'url("/images/' + usersloginid + '/' + content.place + '.jpg")');
                    selected.parent().css('border', "");
                    selected.removeClass('picswapSelect');
                    selected.attr('isNull', true);
                    $('#addPic').addClass('hide');
                    selected = null;
                    firstpic = null;
                }
            });
        });
    });
    $('#FacebookaddPic').click(function () {
        var html = "";
        $.post("/getfbpics", null, function (data, status) {
            if (status === "success") {
                var selected = $(".picswapSelect");
                var content = selected.attr('content');
                console.log(content);
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
                $('#lbFacebookorImport').addClass('hide');
                $('#lightbox').attr('type', 'Facebookaddpics');
                $('#lbAddPics').removeClass('hide');
                $('#lbAddPics').html(html);
                $('#lbAddPics').off();
                $('#lbAddPics').on('click', '.lbimg', function () {
                    var that = $(this);
                    $.post("/savenewfbpic", {picid: $(this).attr('picid'), order: order, content: content}, function (data) {
                        if (data === 'success') {
                            var selected = $(".picswapSelect");
                            selected.attr('isNull', true);
                            $('#lightbox').addClass('hide');
                            $('#lightbox').attr('type', '');
                            $('#lbAddPics').addClass('hide');
                            $('#lbAddPics').html("");
                            selected.css('background-image', that.css("background-image"));
                            $('#addPic').addClass('hide');
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
    var deleteaccount = document.getElementById("deleteaccount");
    deleteaccount.onclick = function () {
        $('#lightbox').removeClass('hide');
        $('#lightbox').attr('type', 'lbDeleteAccount');
        $('#lbDeleteAccount').removeClass('hide');
    };
});
$(document).mouseup(function (e) {
    var container = $(".matchdrop");
    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0)
    {
        container.addClass('hide');
    }
});
$(document).mouseup(function (e) {
    var container = $("#randomfilterdropdown");
    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0 && container.hasClass('hide') === false)
    {
        var savedata = {save1: false, save2: false, save3: false};
        $.each($(".ranFilterSelected"), function () {
            if ($(this).attr("position") === "1") {
                savedata.save1 = true;
            }
            if ($(this).attr("position") === "2") {
                savedata.save2 = true;
            }
            if ($(this).attr("position") === "3") {
                savedata.save3 = true;
            }

        });
        // console.log(savedata);
        $.post("/updateranfilter", savedata, function (data) {
            console.log(data);
            if (data === "success") {
            }
        });
        container.addClass('hide');
    }
});
function loadprofileedit(data, status) {
    if (status !== "success" || data === "unauth" || data === "notfound") {
        window.location.replace('/logout');
        return;
    }
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
    var profileeditclosebutton = document.getElementById('profileeditclosebutton');
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
        console.log(data);
    };
    profileeditclosebutton.onclick = function () {
        saveprofile(false);
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

    profileeditwindow.classList.remove('hide');
    window.scrollTo(0, document.body.scrollHeight);
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
                profileeditsubmit.innerHTML = "apply";
                profileeditsubmit.style.backgroundColor = "";
            }, 2000);
        }
    });
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
function loadSettings(data, status) {
    if (status !== "success" || data === "unauth" || data === "notfound") {
        window.location.replace('/logout');
        return;
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
    initMap(data.location);
    var settingssubmit = document.getElementById("settings-submit");
    var settingswindow = document.getElementById("settingswindow");
    var settingsclosebutton = document.getElementById("settingsclosebutton");
    settingssubmit.onclick = function () {
        savesettings();
    };
    settingsclosebutton.onclick = function () {
        savesettings();
    };
    settingswindow = document.getElementById('settingswindow');
    var origins = settingswindow.getElementsByClassName('noUi-base');
    origins[0].classList.add("interest-slider");
    origins = settingswindow.getElementsByClassName('noUi-connect');
    origins[0].classList.add("age-slider");
    settingswindow.classList.remove('hide');
    window.scrollTo(0, document.body.scrollHeight);
    return true;
}
function savesettings() {
    var interestslider = document.getElementById('interest-slider');
    var ageslider = document.getElementById('age-slider');
    var distanceslider = document.getElementById('distance-slider');
    var settingssubmit = document.getElementById("settings-submit");
    var loading = document.getElementById("loading");
    var matchshow = document.getElementById("matchshow");
    var distance = distanceslider.noUiSlider.get();
    distance = distance.replace(" miles", "");
    var google_canvas = document.getElementById('google_canvas');
    var low = ageslider.noUiSlider.get()[0];
    var high = ageslider.noUiSlider.get()[1];
    var savedata = {preference: interestslider.noUiSlider.get(),
        age_range: {low: low, high: high},
        distance: distance,
        location: {lat: google_canvas.getAttribute('lat'), lng: google_canvas.getAttribute('lng')}};
    $.post("/savesettings", savedata, function (data, status) {
        if (data === "success") {
            //findmatcheswindow.classList.remove('hide');
            loading.classList.remove('hide');
            matchshow.classList.add('hide');
            $.post("/loadfindmatches", "load", loadFindMatches);
            settingssubmit.innerHTML = data;
            settingssubmit.style.backgroundColor = "#4CAF50";
            setTimeout(function () {
                settingssubmit.innerHTML = "apply";
                settingssubmit.style.backgroundColor = "";
            }, 2000);
        }
    }
    );
}
function initMap(savedlatlng) {
    if (navigator.geolocation) {
        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
        navigator.geolocation.getCurrentPosition(function (position) {
            loadMap(position.coords, savedlatlng);
        }, function (error) {
            var crd = {latitude: 40.699513, longitude: -74.018789}; //NYC
            loadMap(crd, savedlatlng);
        }, options);
    } else {
        var crd = {latitude: 40.699513, longitude: -74.018789}; //NYC
        loadMap(crd, savedlatlng);
    }
}
function loadMap(crd, savedlatlng) {
    var google_canvas = document.getElementById('google_canvas');
    if (savedlatlng.lat !== 40.699513 || savedlatlng.lng !== -74.018789) {
        crd = {latitude: savedlatlng.lat, longitude: savedlatlng.lng};
    }
    google_canvas.setAttribute("lat", crd.latitude);
    google_canvas.setAttribute("lng", crd.longitude);
    map = new google.maps.Map(google_canvas, {
        center: {lat: crd.latitude, lng: crd.longitude},
        zoom: 9,
        disableDefaultUI: true,
        styles: [{
                "featureType": "transit",
                "stylers": [
                    {"visibility": "off"}
                ]
            }, {
                "featureType": "poi",
                "stylers": [
                    {"visibility": "off"}
                ]
            }]
    });
    var marker;
    marker = new google.maps.Marker({
        position: {lat: savedlatlng.lat, lng: savedlatlng.lng},
        map: map
    });
    map.addListener('click', function (e) {
        if (marker) {
            marker.setPosition(e.latLng);
        } else {
            marker = new google.maps.Marker({
                position: e.latLng,
                map: map
            });
        }
        google_canvas.setAttribute("lat", marker.position.lat());
        google_canvas.setAttribute("lng", marker.position.lng());
    });
    google_canvas.classList.remove('hide');
}
var open = false;
function loadFindMatches(data, status) {
    console.log("loadFindMatches");
    console.log(data);
    if (status !== "success" || data === "unauth" || data === "notfound") {
        window.location.replace('/logout');
        return;
    }

    var matchshow = document.getElementById('matchshow');
    var matchpic = document.getElementById('matchpic');
    var matchpic2 = document.getElementById('matchpic2');
    var matchpic3 = document.getElementById('matchpic3');
    var matchpic4 = document.getElementById('matchpic4');
    var matchpic5 = document.getElementById('matchpic5');
    var matchpic6 = document.getElementById('matchpic6');
    var loading = document.getElementById('loading');
    var refresh = document.getElementById('refresh');
    var name = document.getElementById('name');
    var like = document.getElementById('like');
    var dislike = document.getElementById('dislike');
    var findmatchprofile = document.getElementById('findmatchprofile');
    var findmatchprofileinfo = document.getElementById('findmatchprofileinfo');
    var matchpicdiv = document.getElementById('matchpicdiv');
    var dist = document.getElementById('dist');
    matchpic.classList.remove('hide');
    like.classList.remove('hide');
    dislike.classList.remove('hide');
    refresh.classList.add('hide');
    var findabout = document.getElementById('findabout');
    loading.classList.add('hide');
    matchshow.classList.remove('hide');
    if (data === "none") {
        if (open === true) {
            //  otherpictures.classList.add('hide');
            dist.classList.add('hide');
            name.classList.add('center-block');
            matchpicdiv.classList.add('center-block');
            findmatchprofileinfo.classList.add('hide');
        }
        name.innerHTML = "out of potential matches";
        refresh.classList.remove('hide');
        matchpic.classList.add('hide');
        like.classList.add('hide');
        dislike.classList.add('hide');
        if (findmatchprofile.classList.contains('center-block') === false) {
            findmatchprofile.classList.add('center-block');
        }
        return;
    }
    var i = 0;
    var RtnObj;
    name.innerHTML = data[i].name + " " + data[i].age;
    dist.innerHTML = data[i].dist + " mi";
    var otherpics = $("#findmatchprofileinfo > .otherpics");
    var num = 0;
    matchpic.setAttribute("prof_id", data[i]._id);
    if (data[i].pictures.pic1 !== null) {
        matchpic.src = "images/" + data[i]._id + "/" + data[i].pictures.pic1 + ".jpg";
    } else {
        matchpic.src = "images/" + data[i]._id + "/1.jpg";
    }
    for (var k in data[i].pictures) {
        if (k === "pic1") {
            continue;
        }
        if (data[i].pictures[k] !== null) {
            if (matchpic.src.slice(-5) !== "1.jpg") {
                $(otherpics[num]).html('<img style="height:40px;" src="images/' + data[i]._id + '/' + data[i].pictures[k] + '.jpg" />');
            } else {
                $(otherpics[num]).addClass('hide');
                $(otherpics[num]).html('<img style="height:40px;" src="images/null.jpg" />');
            }
        } else {
            $(otherpics[num]).addClass('hide');
            $(otherpics[num]).html('<img style="height:40px;" src="images/null.jpg" />');
        }
        num++;
    }
    matchpic.classList.remove('hide');
    if (data[i].about !== "undefined") {
        findabout.innerHTML = data[i].about;
        $("#findabout").slimscroll(
                {height: "145px", size: "5px"} //alwaysVisible: !0, railVisible: !0}
        );
    }
    document.onkeydown = checkKey;
    var length = Object.keys(data).length;
    function checkKey(e) {
        var open;
        e = e || window.event;
        if (e.keyCode === 38 && i < length && data !== 'none') {
            // up arrow
            open = true;
            name.classList.remove('center-block');
            dist.classList.remove('hide');
            findmatchprofile.classList.remove('center-block');
            matchpicdiv.classList.remove('center-block');
            findmatchprofileinfo.classList.remove('hide');
        } else if (e.keyCode === 40 && i < length && data !== 'none') {
            // down arrow
            open = false;
            matchpicdiv.classList.add('center-block');
            dist.classList.add('hide');
            findmatchprofile.classList.add('center-block');
            name.classList.add('center-block');
            findmatchprofileinfo.classList.add('hide');
        } else if (e.keyCode === 39) {
            // right arrow like
            i = likefunction(i, data, RtnObj, length, name, matchpic, loading, matchshow, socket);
        } else if (e.keyCode === 37) {
            // left arrow dislike
            i = dislikefunction(i, data, RtnObj, length, name, matchpic, loading, matchshow, socket);
        }
    }
    like.onclick = function () {
        i = likefunction(i, data, RtnObj, length, name, matchpic, loading, matchshow, socket);
    };
    dislike.onclick = function () {
        i = dislikefunction(i, data, RtnObj, length, name, matchpic, loading, matchshow);
    };
    $('#matchpicdiv').on('click', 'img', function () {
        profilelightbox($(this).attr('prof_id'));
    });
}

function loadchatwindow(profileId, usersloginid, profilename, usersloginname, socket) {
    $.post("/loadmessages", {usersloginid: usersloginid, profileId: profileId}, function (messageData) {
        var chatmessages = document.getElementById("chat-messages");
        chatmessages.setAttribute("messageprofileid", profileId);
        var messagebutton = document.getElementById("new-message-btn");
        var messagetext = document.getElementById("new-message");
        var chatname = document.getElementById("chat-name");
        var chatwindow = document.getElementById("chatwindow");
        chatmessages.innerHTML = "";
        for (var index = 0; index < messageData.messages.length; ++index) {

            if (messageData.messages[index].from === usersloginid) {
                chatmessages.insertAdjacentHTML('beforeend', '<div class="chat-message"><div class="sender pull-right"><div class="img-circle"><img src="images/' + usersloginid + '/' + messageData.profilePic1 + '.jpg" alt=""></div><div class="time">' + timeSince(messageData.messages[index].datetime) + '</div></div><div class="chat-message-body on-right"><span class="right-arrow"></span><div class="sender"><a href="#"></a></div><div class="text">' + messageData.messages[index].message + '</div></div></div>');
            }
            if (messageData.messages[index].to === usersloginid) {
                chatmessages.insertAdjacentHTML('beforeend', '<div class="chat-message"><div class="sender pull-left messageprofile"><div class="img-circle pointer"><img src="images/' + profileId + '/' + messageData.profilePic2 + '.jpg" alt=""></div><div class="time">' + timeSince(messageData.messages[index].datetime) + '</div></div><div class="chat-message-body"><span class="left-arrow"></span><div class="text">' + messageData.messages[index].message + '</div></div></div>');
            }
        }
        chatmessages.scrollTop = chatmessages.scrollHeight;
        $("#chat-messages").slimscroll({scroll: chatmessages.scrollHeight});
        chatname.innerHTML = profilename;
        var message = {profileId: profileId, usersloginid: usersloginid, usersloginname: usersloginname};
        messagebutton.onclick = function () {
            sendMessage(messagetext, socket, chatmessages, message, messageData.profilePic1);
        };
        document.onkeydown = checkKey;
        function checkKey(e) {
            e = e || window.event;
            if (e.keyCode === 13) {
                sendMessage(messagetext, socket, chatmessages, message, messageData.profilePic1);
            }
        }
        chatmessages.scrollTop = chatmessages.scrollHeight;
        $("#chat-messages").slimscroll(
                {height: "340px", size: "5px", scroll: chatmessages.scrollHeight} //alwaysVisible: !0, railVisible: !0}
        );
        if (chatwindow.classList.contains("hide")) {
            chatwindow.classList.remove('hide');
            chatmessages.scrollTop = chatmessages.scrollHeight;
            $("#chat-messages").slimscroll({scroll: chatmessages.scrollHeight});
        }
        $('#chat-messages').off();
        $('#chat-messages').on('click', '.img-circle', function () {
            profilelightbox(profileId);
        });
    });
}
function timeSince(date) {
    var seconds = Math.floor((new Date() - new Date(date)) / 1000);
    var interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval + "y ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + "m ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + "d ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + "h ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + "m ago";
    }
    return Math.floor(seconds) + "s ago";
}
function dislikefunction(i, data, RtnObj, length, name, matchpic, loading, matchshow) {
    var dislike = document.getElementById('dislike');
    if (i + 1 < length) {
        RtnObj = {like: false, fbid2: data[i].fbid};
        $.post("/sortmatches", RtnObj, function () {
            dislike.classList.add('color-red');
            setTimeout(function () {
                dislike.classList.remove('color-red');
            }, 600);
        });
        i++;
        name.innerHTML = data[i].name + " " + data[i].age;
        matchpic.setAttribute("prof_id", data[i]._id);
        if (data[i].pictures.pic1 !== null) {
            matchpic.src = "images/" + data[i]._id + "/" + data[i].pictures.pic1 + ".jpg";
        } else {
            matchpic.src = "images/" + data[i]._id + "/1.jpg";
        }
        return i;
    } else {
        RtnObj = {like: false, fbid2: data[i].fbid};
        $.post("/sortmatches", RtnObj, function () {
            loading.classList.remove('hide');
            matchshow.classList.add('hide');
            $.post("/loadfindmatches", "dislike", loadFindMatches);
        });
        return length;
    }
}
function likefunction(i, data, RtnObj, length, name, matchpic, loading, matchshow, socket) {
    var like = document.getElementById('like');
    if (i + 1 < length) {
        console.log(data);
        RtnObj = {like: true, fbid2: data[i].fbid};
        $.post("/sortmatches", RtnObj, function (sortData) {
            if (sortData.match === true) {
                var noMatches = document.getElementById("no-matches");
                if (document.contains(noMatches)) {
                    noMatches.remove();
                }
                console.log(sortData);
                addToMatchList(sortData.matchdata.profileId, sortData.matchdata.name, sortData.matchdata.isNull1, sortData.matchdata.online);
            }
        });
        like.classList.add('color-green');
        setTimeout(function () {
            like.classList.remove('color-green');
        }, 600);
        i++;
        name.innerHTML = data[i].name + " " + data[i].age;
        matchpic.setAttribute("prof_id", data[i]._id);
        if (data[i].pictures.pic1 !== null) {
            matchpic.src = "images/" + data[i]._id + "/" + data[i].pictures.pic1 + ".jpg";
        } else {
            matchpic.src = "images/" + data[i]._id + "/1.jpg";
        }
        return i;
    } else {
        console.log(data[i]);
        RtnObj = {like: true, fbid2: data[i].fbid};
        $.post("/sortmatches", RtnObj, function (sortData) {
            if (sortData.match === true) {
                var noMatches = document.getElementById("no-matches");
                if (document.contains(noMatches)) {
                    noMatches.remove();
                }
                console.log(sortData);
                addToMatchList(sortData.matchdata.profileId, sortData.matchdata.name, sortData.isNull1, sortData.online);
                var usersloginid = document.getElementById('profileedit').getAttribute('userid');
                socket.emit('match', {to: sortData.matchdata.profileId, from: usersloginid, name: sortData.matchdata.name});
            }
            loading.classList.remove('hide');
            matchshow.classList.add('hide');
            $.post("/loadfindmatches", "like", loadFindMatches);
        });
        return length;
    }
}
function profilelightbox(profileId) {
    var profileObj = {profileId: profileId};
    $.post("/getspecificprofile", profileObj, function (rtnObj) {
        for (var i = 1; i < Object.keys(rtnObj.pictures).length; i++) {
            if (rtnObj.pictures['isNull' + i] !== false) {
                $('#lbpic' + i).css('background-image', 'url("/images/' + profileId + '/' + rtnObj.pictures['pic' + i] + '.jpg")');
                $('#lbpic' + i).removeClass('hide');
            } else {
                if (!$('#lbpic' + i).hasClass('hide')) {
                    $('#lbpic' + i).addClass('hide');
                }
            }
        }
        $('#lbName').html(rtnObj.name);
        $('#lbAge').html(rtnObj.age);
        $('#lbDistance').html(rtnObj.dist + "mi");
        $('#lbEdu').html(rtnObj.education);
        $('#lbAbout').html(rtnObj.about);
        $('#lightbox').removeClass('hide');
        $('#lightbox').attr('type', 'profilelightbox');
        $('#profilelightbox').removeClass('hide');
    });
}
function addToMatchList(profileId, name, isNull1, online) {
    if ($(".ranHistory[matchprofileid = " + profileId + "]").length) {
        $(".ranHistory[matchprofileid = " + profileId + "]").remove();
    }
    var noMatches = document.getElementById("no-matches");
    if (document.contains(noMatches)) {
        noMatches.remove();
    }
    var matchlist = document.getElementById("match-list");
    var matchhtml = "<li><div class='pull-left img-circle pointer' matchprofileid='" + profileId + "' name='" + name + "'";
    matchhtml += "alt='''><img ";
    if (isNull1) {
        matchhtml += "src='images/" + profileId + "/1.jpg'/>";
    } else {
        matchhtml += "src='images/null.jpg'/>";
    }
    matchhtml += "</div><div class='news-item-info'><span id='userName'>" + name + "</span>";
    matchhtml += '<span class="';
    if (online === "false") {
        matchhtml += 'hide';
    }
    matchhtml += '"style="font-weight:bold;color:rgb(76, 175, 80);" id="online" matchProfileId="' + profileId + '"> ONLINE</span>';
    matchhtml += '<span class="rrdroparrow pull-right pointer" style="" id="" matchProfileId="' + profileId + '"><i class="fa fa-sort-desc" aria-hidden="true"></i></span>';
    matchhtml += '<div id="account-menu" class="matchdrop hide dropdown-menu account" role="menu">';
    matchhtml += '<div role="presentation" class="account-picture report pointer">Report</div>';
    matchhtml += '<div role="presentation" class="account-picture unmatch pointer">Unmatch</div></div>';
    matchhtml += '<div class="position">';
    matchhtml += '<span class="chat" matchProfileId="' + profileId + '" name="' + name + '"><i class="fa fa-comments fa-2x"></i>';
    matchhtml += '<span class="missedchatscount hide" style="" class="">0</span><span class="missedmessage" style="font-size: 14px; margin-left:10px;"></span></span>';
    matchhtml += '<i pic1="" matchProfileId="' + profileId + '" name="' + name + '" class="videocall fa fa-phone-square fa-2x"></i></div></div></li>';
    matchlist.insertAdjacentHTML('beforeend', matchhtml);

    ronAlert("You've Matched With " + name + "!", 3500);
}


function sendMessage(messagetext, socket, chatmessages, message, profilePic1) {
    if (messagetext.value !== "") {
        socket.emit('msg', {to: message.profileId, from: message.usersloginid, name: message.usersloginname, msg: messagetext.value});
        chatmessages.insertAdjacentHTML('beforeend', '<div class="chat-message"><div class="sender pull-right"><div class="img-circle"><img src="images/' + message.usersloginid + '/' + profilePic1 + '.jpg" alt=""></div><div class="time">' + timeSince(Date.now()) + '</div></div><div class="chat-message-body on-right"><span class="right-arrow"></span><div class="sender"><a href="#"></a></div><div class="text">' + messagetext.value + '</div></div></div>');
        chatmessages.scrollTop = chatmessages.scrollHeight;
        $("#chat-messages").slimscroll({scroll: chatmessages.scrollHeight});
        var rightmatch = $('.chat[matchprofileid=' + message.profileId + ']');
        var spanmissedmessage = rightmatch.find('.missedmessage');
        var abreviatedMsg = messagetext.value;
        console.log
        if (abreviatedMsg.length > 12) {
            abreviatedMsg = abreviatedMsg.substring(0, 12) + "...";
        }
        spanmissedmessage.html(abreviatedMsg);
        messagetext.value = "";
    }
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


function ronAlert(message, time) {
    $(".notifications>.alert").html(message);
    $(".notifications").css("display", "");
    setInterval(function () {
        $(".notifications").fadeOut("slow");
    }, time);
}