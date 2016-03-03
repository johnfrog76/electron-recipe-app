$(function(){
    // Electron's UI library. We will need it for later.
    // for example shell.openExternal(href)
    var shell = require('shell');
    var baseURL = 'http://sbtest.com/recipe/';
    var listURL = baseURL + 'platform/recipe_api.php?view=recipes';
    var logoutURL = baseURL + 'platform/api_end_session.php';
    var viewURL = baseURL + 'platform/recipe_api.php?view=recipe&id=';
    var postURL = baseURL + 'platform/api_signin.php';
    var showLoad = function () {
        $('#loading').fadeIn('slow');
    };
    var hideLoad = function () {
        $('#loading').fadeOut('slow');
    };
    var drawSideBar = function () {
        //even out sidebar height
        var leftHeight = $('#left').height();
        var rightHeight = $('#right').height();
        var sideBarHeight = $('#sidebar').height();
        var diff = leftHeight - rightHeight;
        sideBarHeight += diff;
        $('#sidebar').css('height', sideBarHeight + 'px');
    };

    var initTable = function (tableRowsData) {
        var markup = '<table class="table table-hover table-striped table-responsive">' +
            '<thead><tr><th>Name</th><th>Category</th><th>Action</th></tr></thead>' +
            '<tbody></tbody></table>';
        $('#tableHolder').html(markup);
        $('#tableHolder tbody').html(tableRowsData);

        $('#tableHolder table').DataTable({
            "sPaginationType": "bootstrap",
            "aLengthMenu": [5, 10, 15, 25, 50],
            "iDisplayLength": 5,
            "bDestroy": true,
            "bStateSave": false,
            "oLanguage": {
                "sLengthMenu": "Records / Page: _MENU_ "
            },
            "aoColumnDefs": [{
                'bSortable': false,
                'aTargets' : [2]
            }]
        });

        //Add a bunch of bootstrap classes for grid positioning
        $('.dataTables_info').addClass('col-md-4 col-sm-4');
        $('.dataTables_paginate').addClass('col-md-6 col-sm-6');
        $('.dataTables_filter input, .dataTables_length select').
            addClass('form-control');
        $('.dataTables_filter, .dataTables_length').
            wrapAll('<div class="row"></div>');
        $('.dataTables_filter, .dataTables_length').wrapAll('<div class="btnwrap-right"></div>');
        $('.btnwrap-right').addClass('col-md-2 col-sm-2 col-xs-4');

        $('.dataTables_paginate, .dataTables_info').wrapAll('<div class="row"></div>');
        $('.dataTables_length select').removeAttr('size');

    };
    var removeTable = function () {
        var objTable = $('#tableHolder table').dataTable();
        $('#tableHolder table').removeClass('dataTable');
        objTable.fnDestroy();
        $('#tableHolder').empty();
        drawSideBar();
    };
    var SESS = {
        logout: function () {
            var d = $.Deferred();
            $.ajax({
                type: 'DELETE',
                url: logoutURL,
                success: function (data) {
                   d.resolve(data);
                }
            });
            return d.promise();
        },
        getItem: function (itemId) {
            var d = $.Deferred();
            $.ajax({
                dataType: "json",
                url: viewURL + itemId,
                success: function (item) {
                   d.resolve(item);
                }
            });
            return d.promise();
        },
        getList: function () {
            var d = $.Deferred();
            $.ajax({
                dataType: "json",
                url: listURL,
                success: function (list) {
                    d.resolve(list);
                }
            });
            return d.promise();
        },
        login: function (user, pass) {
            var d = $.Deferred();
            $.ajax({
                url:postURL,
                type: 'POST',
                data: {
                    name: user,
                    pass: pass
                }
             }).done(function (data, textStatus, xhr) {
                 var myData = JSON.parse(data);
                 if (myData.hasOwnProperty('message')) {
                     d.reject(myData);
                 } else {
                     d.resolve(myData);
                 }
            });
            return d.promise();
        }
    };
    var processRecipeData = function (data) {
        var retSteps = [];
        var retIngredients = [];
        var retComments = [];
        var strTemplate = '<h4>{0}</h4>' +
            '<div>rating: <span class="rate-recipe {4}"></span></div>' +
            '<h5>Ingredients</h5>' +
            '<ul>{1}</ul>' +
            '<h5>Steps</h5>' +
            '<ol>{2}</ol>' +
            '<h5>Comments</h5>' +
            '<ul class="comments">{5}</ul>'
        var carrotClsMap = {
            carrot1: 'oneCarrot',
            carrot2: 'twoCarrot',
            carrot3: 'threeCarrot',
            carrot4: 'fourCarrot'
        };
        var i;
        var ingredients = data.ingredients;
        var steps = data.steps;
        var comments = data.comments;
        var item;
        var key = ('carrot' + data.rating);

        for (i = 0; i < ingredients.length; i++) {
            item = '<li>' + ingredients[i] + '</li>';
            retIngredients.push(item);
        }
        for (i = 0; i < comments.length; i++) {
            item = '<li><span class="comment">' + comments[i].comment +
                '</span><span class="user">' + comments[i].user + '</span></li>';
            retComments.push(item);
        }
        for (i = 0; i < steps.length; i++) {
            item = '<li>' + steps[i] + '</li>';
            retSteps.push(item);
        }

        if (comments.length === 0) {
            retComments.push('<li>None</li>');
        }

        return strTemplate.replace('{0}', data.r_name)
            .replace('{1}', retIngredients.join(''))
            .replace('{2}', retSteps.join(''))
            .replace('{4}', carrotClsMap[key])
            .replace('{5}', retComments.join('<br>'));
    };
    var clearLogin = function () {
        $('.login-modal input').val('');
        $('.login-modal').modal('hide');
        $('#topUser .login').hide();
        $('#topUser .logout').show();
    };

    var loadPage = function () {
        showLoad();
        SESS.getList().done(function (data) {
            var rowTemplate;
            var name;
            var category;
            var myId;
            var i;
            var markup = [];

            for (i = 0; i < data.length; i++) {
                rowTemplate = '<tr>' +
                    '<td>{0}</td>' +
                    '<td>{1}</td>' +
                    '<td><button class="btn btn-info btn-xs" data-toggle="modal" id="btn-{2}" ' +
                    'data-target="#recipe-modal">View</button></td>' +
                    '</tr>';
                name = data[i].r_name;
                category = data[i].category;
                myId = data[i].id;
                rowTemplate = rowTemplate.replace('{0}', name).
                    replace('{1}', category).replace('{2}', myId);
                markup.push(rowTemplate);
            }
            initTable(markup);
            $("#recipe-modal").on('show.bs.modal', function (e) {
                var id = e.relatedTarget.id;
                var myId = id.split('-');
                showLoad();

                SESS.getItem(myId[1]).done(function (data) {
                    $('.recipe-container').html(processRecipeData(data));
                    hideLoad();
                });
            });

            $('#recipe-modal').on('hidden.bs.modal', function () {
                $('.recipe-container').empty();
            });

            $('body').addClass('logged-in');
            $('select').change(function () {
                drawSideBar();
            });
            drawSideBar();
            hideLoad();
        });
    };

    $('#topUser a:contains(LOG IN)').click(function () {
        //$('.login-modal').modal('show');
        $('.login-modal').modal({backdrop: false});
        return false;
    });

    $('#topUser a:contains(LOG OUT)').click(function () {
        SESS.logout().done(function (data) {
            if (data === 'session destroyed') {
                $('#welcome span.session').text('--');
                $('#topUser .login').show();
                $('#topUser .logout').hide();
                $('body').removeClass('logged-in');
                removeTable();
            }
        });
        return false;
    });

    $('#topUser a:contains(SIGN UP)').click(function (e) {
        e.preventDefault();
        var href = baseURL + 'signup.php';

        // Open URL with default browser.
        shell.openExternal(href);
    });

    $('.login-modal .btn-primary').click(function () {
        var myVals = $('.login-modal input');
        var user = myVals[0].value;
        var pass = myVals[1].value;

        SESS.login(user, pass).done(function (data) {
            $('#welcome span.session').text(data.user);
            $('.login-modal h4').html('Please sign in');
            loadPage();
            clearLogin();
        }).fail(function (fail) {
            $('.login-modal .btn-primary').blur();
            $('.login-modal h4').html('Try again');
        });
        return false;
    });

    drawSideBar();
});
