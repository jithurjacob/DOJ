$("table").stickyTableHeaders();

    var app = angular.module('myApp', []);


    app.factory('MultiOrderFact', function() {
        var MultiOrder = {};
        //override these in your controller
        //an order that is appended to the end of any sort (only matters when the sorted element has identical elements)
        MultiOrder.forceOrder = [];
        //set this in the controller to set the initial sorting - after this contains the actual current sort
        MultiOrder.orderArray = [];
        //the class to apply to ascendingly sorted order selection element (usually the header)
        MultiOrder.plusSortClass = "";
        //the class to apply to descendingly sorted order selection element (usually the header)
        MultiOrder.minusSortClass = "";
        //use in on-click event
        MultiOrder.modOrder = function(evt, name) {

            //setup vars, remove the force sorts and clear all classes.
            MultiOrder.orderArray.splice(MultiOrder.orderArray.length - (MultiOrder.forceOrder.length) + 1, MultiOrder.forceOrder.length);
            angular.element(evt.currentTarget).parent().parent().children().removeClass(MultiOrder.plusSortClass + " " + MultiOrder.minusSortClass);
            console.log(angular.element(evt.currentTarget).parent());
            if (evt.shiftKey) {
                //multisort
                for (var i = 0; i < MultiOrder.orderArray.length; i++)
                    if (MultiOrder.orderArray[i] == '-' + name) {
                        MultiOrder.orderArray[i] = '+' + name;
                        angular.element(evt.currentTarget).parent().addClass(MultiOrder.plusSortClass);
                        return false;
                    } else if (MultiOrder.orderArray[i] == '+' + name) {
                    MultiOrder.orderArray[i] = '-' + name;
                    angular.element(evt.currentTarget).parent().addClass(MultiOrder.minusSortClass);
                    return false;
                }
                MultiOrder.orderArray.push('+' + name);
                angular.element(evt.currentTarget).addClass(MultiOrder.plusSortClass);
            } else {
                //single sort
                angular.element(evt.currentTarget).parent().children().removeClass(MultiOrder.plusSortClass + " " + MultiOrder.minusSortClass);
                if (MultiOrder.orderArray[0] == '+' + name) {
                    MultiOrder.orderArray = ['-' + name];
                    angular.element(evt.currentTarget).parent().addClass(MultiOrder.minusSortClass);
                } else {
                    MultiOrder.orderArray = ['+' + name];
                    angular.element(evt.currentTarget).parent().addClass(MultiOrder.plusSortClass);
                }
            }
            //add sort forces - remember forceOrder elements are -value and name is value
            for (var i = 0; i < MultiOrder.forceOrder.length; i++)
                if (MultiOrder.forceOrder[i].replace(/[+-]/, "").indexOf(name.replace(/[+-]/, "")) == -1) MultiOrder.orderArray.push(MultiOrder.forceOrder[i]);
            return false;
        }

        return MultiOrder;
    });

    app.controller('collegeCtrl', function($scope, $http, MultiOrderFact) {
        $('#loader_div').show();
        $('#main_table').hide();
        $http.get("/college/").then(function(response) {
            $('#loader_div').hide();
            $('#main_table').show();
            $scope.headers = ["Name", "Total Students", "Unknown", "Waiting", "Joined", "Not Joining"]
            $scope.headers_ = ["name", "total", "unknown", "joined", "notjoining"]
            $scope.choices = ["Unknown", "Waiting", "Joined", "NotJoining"]
            $scope.colleges = response.data.colleges;

            //console.log($scope);
            $scope.MultiOrder = MultiOrderFact;
            //$scope.MultiOrder.orderArray = ['-total'];
            //$scope.MultiOrder.forceOrder = ['-total'];//sort on filter to see this work
            $scope.MultiOrder.plusSortClass = "headerSortDown";
            $scope.MultiOrder.minusSortClass = "headerSortUp";

            $scope.modOrder = MultiOrderFact.modOrder;

        });
    });


    $(document).on("click", ".load_btn1", function() {
        var id = $(this).attr('data');
        //alert(id);
        $("#myModalLabel").text($(this).text());
        $("#myModalBtn").hide();
        $("#docsModal").modal({
            backdrop: "static"
        });
    });


    app.controller('studentCtrl', function($scope, $http) {

        var stud_ori = [{
            "id": 1,
            "name": "Student Name"
        }];
        $scope.students = stud_ori;
        $scope.loadPeople = function(collegeid, collegename) {
            //alert(collegeid);
            $("#myModalLabel").text(collegename);
            $("#myModalLabel").attr('data-id', collegeid);
            $("#myModalBtn").hide();
            $("#myModalLoader").show();
            $("#docsModal").modal({
                backdrop: "static"
            });

            var httpRequest = $http({
                method: 'GET',
                url: '/students/' + collegeid

            }).success(function(data, status) {
                $scope.students = data.students;

                $("#myModalLoader").hide();
            });
        };
        $scope.changed_ = function(rowid, status, savedStatus) {
            //console.log();


            if (status != savedStatus) {

                $($('.modal-body  .table-striped tr').eq(rowid)).css("background-color", "rgba(207, 210, 218, 1)").addClass('edited');

                $($('.modal-body  .table-striped tr').eq(rowid)).attr('data-status', status);

            } else {
                $($('.modal-body  .table-striped tr').eq(rowid)).css("background-color", "").removeClass('edited');
            }
            if ($('tr').hasClass('edited')) {
                $("#myModalBtn").show();
            } else {
                $("#myModalBtn").hide();
            }
        }

        $scope.save = function() {
            var datatosend = [];
            $('.edited').each(function() {
                $this = $(this);
                datatosend.push({
                    id: ($this.attr('data-id')),
                    status: ($this.attr('data-status'))
                });
            });
            jQuery.ajax({
                contentType: 'application/json',
                type: 'POST',
                url: "/students/",
                data: JSON.stringify(datatosend),
                dataType: "json",
                success: function(data) {

                    if (data.msg == "ok") {
                        $("#myModalResult").text('Data Saved');
                        $("#myModalBtn").hide();
                        //location.reload();
                        $('.edited').each(function() {

                            $this = $(this);
                            ($this).css("background-color", "").removeClass('edited');
                        });
                    }
                }
            });
        }

        $scope.addStudent = function() {
            //alert(0);

            var collegeid = $("#myModalLabel").attr('data-id');
            var name = $('#name').val();
            if (name != "") {
                $("#myModalLoader").show();

                jQuery.ajax({
                    contentType: 'application/json',
                    type: 'POST',
                    url: "/addStudent/",
                    data: JSON.stringify({
                        name: name,
                        collegeid: collegeid
                    }),
                    dataType: "json",
                    success: function(data) {
                        $scope.students = data.students;
                        $('#name').val('');
                        $('#nameCheck').checked=(false);
                        $("#myModalLoader").hide();
                         location.reload();
                    }
                });
            }
        }



    });


    function reload() {
        if ($("#myModalResult").text() == ('Data Saved')) {
            location.reload();
        }
    }