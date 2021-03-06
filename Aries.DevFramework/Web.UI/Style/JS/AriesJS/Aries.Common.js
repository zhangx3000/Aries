﻿//AR.Common 定义
(function ($, $Core) {
    //定义Common对象
    $Core.Common = {
        _Internal: {
            Editor: {
                onEdit: function (el, dgid, value, index) {
                    var dg = getDgByKey(dgid);
                    dg.PKColumn.Editor.BtnEdit.onExecute(dg, value, index);
                },
                onDel: function (el, dgid, value, index) {
                    var dg = getDgByKey(dgid);
                    dg.PKColumn.Editor.BtnDel.onExecute(dg, value, index);
                },
                onSave: function (el, dgid, value, index) {
                    var dg = getDgByKey(dgid);
                    dg.PKColumn.Editor.BtnSave.onExecute(dg, value, index);
                },
                onCancel: function (el, dgid, value, index) {
                    var dg = getDgByKey(dgid);
                    dg.PKColumn.Editor.BtnCancel.onExecute(dg, value, index);
                }
            },

            Search: function () {
                var that = this;
                $Core.BtnBase.call(that);
                that.$target = null;
                //存档所有Input的对象数组，在调用bind()方法后才能获取。
                that.Items = new $Core.Dictionary();
                that.BtnQuery = function () {
                    function Obj() {
                        $Core.BtnBase.call(this);
                        /**
                        *查询条件的json，可在查询之前修改执行
                        *@param{Array} search
                        */
                        this.onBeforeExecute = function (searchJsonArray) { };
                        this.onAfterExecute = function (searchJsonArray) { };
                        this.onExecute = function (dg, btn_query) {
                            if (!btn_query) { btn_query = this.$target; }
                            var targetForm = btn_query.parents("form");
                            var searchJson = $Core.Common._Internal.buildSearchJson(targetForm);
                            //装载默认where条件，过滤到表单已有的数据。
                            if (dg.options.defaultWhere && dg.options.defaultWhere.length > 0) {
                                for (var i = 0; i < dg.options.defaultWhere.length; i++) {
                                    var isHasData = false;
                                    var paramName = dg.options.defaultWhere[i].paramName;
                                    for (var j = 0; j < searchJson.length; j++) {
                                        if (searchJson[j].paramName == paramName) {
                                            isHasData = true;
                                            break;
                                        }
                                        if (!isHasData) {
                                            searchJson.push(dg.options.defaultWhere[i]);
                                        }
                                    }
                                }
                            }
                            if (this.onBeforeExecute(searchJson) == false) {
                                return;
                            }
                            if (targetForm.form("validate")) {
                                var jsonString = JSON.stringify(searchJson);
                                var target = dg.$target;
                                dg.isSearch = true;
                                if (dg.type == 'treegrid') {
                                    target.treegrid("options").onBeforeLoad = function (row, param) {
                                        param.rows = null;
                                        param.page = null;
                                        eval("sys_search = '" + jsonString + "'");
                                        param.sys_search = sys_search;
                                    }
                                    target.treegrid('reload');
                                }
                                if (dg.type == 'datagrid') {
                                    var str = jsonString.replace(/\'/g, "!#");
                                    eval("sys_search = '" + str + "'");
                                    var data = { sys_search: sys_search.replace(/!#/g, "'") };
                                    if (target.datagrid('getRows')) {
                                        target.datagrid('clearSelections');
                                    }
                                    dg.datagrid("load", data);

                                }
                                this.onAfterExecute(searchJson);
                            }
                        }

                    }
                    return new Obj();
                }();
                that.BtnReset = function () {
                    function Obj() {
                        $Core.BtnBase.call(this);
                        /**
                        *充值按钮，可重置条件后赋值
                        *@param{Array} sys_search
                        */
                        this.onBeforeExecute = function ($form) { };
                        this.onExecute = function (dg, btn_reset) {
                            if (!btn_reset) { btn_reset = this.$target; }
                            btn_reset.parents("form")[0].reset();
                            if (this.onBeforeExecute(btn_reset.parents("form")[0]) == false) {
                                return false;
                            }
                            //清楚验证样式
                            $(".easyui-validatebox").removeClass("validatebox-text").removeClass("validatebox-invalid");
                            //在做一次标签的清楚，进行测底的清楚残留数据
                            $("[name]").val("");
                            var target = $("#" + dg.id);
                            setTimeout(function () {
                                $(".combo-value").val("");
                                $("[comboname]").each(function () {
                                    var $target = $(this);
                                    try {
                                        setCombo($target,"clear");
                                        setCombo($target,"setValue", "请选择");
                                    } catch (e) {

                                    }
                                    try {
                                        $target.combotree("clear");
                                        $target.combotree("setValue", "请选择");
                                    } catch (e) {

                                    }
                                });

                            }, 100);

                            if (dg.type == 'treegrid') {
                                target.treegrid("options").onBeforeLoad = function (row, param) {
                                    var opts = $("#" + dg.id).datagrid("options");
                                    var jsonString;
                                    if (opts.defaultWhere && opts.defaultWhere.length > 0) {
                                        jsonString = JSON.stringify(opts.defaultWhere);
                                    }
                                    param.sys_search = jsonString;
                                    param.page = null;
                                    param.rows = null;
                                }
                                target.treegrid('reload');
                            }
                            if (dg.type == 'datagrid') {
                                if (target.datagrid('getRows')) {
                                    target.datagrid('clearSelections');
                                }
                                var opts = $("#" + dg.id).datagrid("options");
                                var jsonString;
                                if (opts.defaultWhere && opts.defaultWhere.length > 0) {
                                    jsonString = JSON.stringify(opts.defaultWhere);
                                }
                                var data = { sys_search: jsonString };
                                target.datagrid('load', jsonString ? data : []);
                            }
                            this.onAfterExecute();
                        }
                    }
                    return new Obj();
                }();
                that.onExecute = function (dg) {
                    if (that.onBeforeExecute() != false) {
                        _createSearchAreaHtml(dg);
                        that.onAfterExecute();
                    }
                };
            },
            ToolBar: function () {
                var that = this;
                $Core.BtnBase.call(that);
                that.$target = null;
                that.isHidden = false;
                //存档所有按钮的对象数组，在调用bind()方法后才能获取。
                that.Items = new $Core.Dictionary();
                that._btnArray = new Array();
                /**
                *向工具条添加按钮
                *@param{string} text 按钮显示的文本
                *@param{string} fname 按钮注册的事件函数名称
                *@param{int} index 按钮的索引排序值从1开始,默认值最后
                *@param{string} css 样式名称，默认值'btn-sm'
                *@param{string} lv2action 二级权限控制，默认值0
                */
                that.add = function (text, fname, index, css, lv2action) {
                    var obj = new Object();
                    obj.index = index || this._btnArray.length + 1;
                    obj.lv2action = lv2action;
                    obj.btn = {
                        title: text,
                        click: fname,
                        css: css || 'btn-sm'
                    }
                    this._btnArray.push(obj);
                }
                /**
                *向工具条添加自定义的HTML元素
                *@param{string} HTMLString 一个字符串标签
                *@param{string} index 按钮的索引排序值从1开始,默认值最后
                *@param{int} lv2action 二级权限控制，默认值0
                */
                that.addHtml = function (HTMLString, index, lv2action) {
                    var obj = new Object();
                    obj.index = index || this._btnArray.length + 1;
                    obj.btn = {
                        html: HTMLString,
                        lv2action: lv2action
                    }
                    this._btnArray.push(obj);
                }
                that.BtnAdd = function () {
                    function Obj() {
                        $Core.BtnBase.call(this);
                        //重新设定打开窗体的标题
                        this.winTitle = null;
                        //重新设定打开窗体的链接
                        this.winUrl = null;
                        //dg 是当前datagrid对象
                        this.onBeforeExecute = function (index, isSameLevel) { };
                        this.onExecute = function (dg, index, isSameLevel) {
                            if (this.onBeforeExecute(index, isSameLevel) == false) { return; };
                            var isTreeGrid = dg.type == "treegrid";
                            if (!this.winUrl && (dg.isEditor || isTreeGrid)) {
                                if (endEditing(dg)) {
                                    dg.PKColumn.Editor.operator = "Add";
                                    var _row = {};
                                    var _data = dg.defaultInsertData;
                                    if (_data && typeof (_data) === 'object') {
                                        _row = $.extend(_row, _data);
                                    }
                                    var addIndex;
                                    if (isTreeGrid) {
                                        if (_row[dg.options.idField])//外部设置了值
                                        {
                                            addIndex = _row[dg.options.idField];
                                        }
                                        else {
                                            addIndex = $Core.Utility.guid();
                                            _row[dg.options.idField] = addIndex;
                                        }
                                    }
                                    else {
                                        addIndex = dg.datagrid('getRows').length;
                                    }
                                    //if (dg.PKColumn.Editor.isInsertRow)
                                    //{
                                    //    var pkField = dg.Internal.primarykey;
                                    //    _row = $.extend(_row, _rows[_len - 1] || {});
                                    //    delete _row[dg.Internal.primarykey];
                                    //}
                                    if (isTreeGrid) {
                                        // _row = {};
                                        _row = {
                                            parent: undefined,
                                            data: [_row]
                                        }
                                        var node = dg.datagrid("find", index);
                                        if (node) {
                                            _row.parent = isSameLevel ? node[dg.options.parentField] : node[dg.options.idField];
                                            _row.data[0][dg.options.parentField] = _row.parent;
                                        }
                                    }
                                    dg.datagrid("appendRow", _row);
                                    dg.PKColumn.Editor.editIndex = addIndex;//指定操作的索引
                                    dg.datagrid("refreshRow", addIndex);//变更按钮状态
                                    dg.datagrid('selectRow', addIndex);//光标定位到行
                                    dg.datagrid('beginEdit', addIndex);//开启编辑
                                }
                            }
                            else {
                                $Core.Global.DG.operating = dg;
                                var href = location.href;
                                var splitIndex = href.indexOf('List') == -1 ? href.lastIndexOf('.') : href.lastIndexOf('List');
                                var viewLink = this.winUrl || href.substring(href.lastIndexOf('/') + 1, splitIndex) + 'Edit.html';
                                $Core.Utility.Window.open(viewLink, this.winTitle, false);

                            }
                            this.onAfterExecute(index, isSameLevel);
                        };
                    }
                    return new Obj();
                }();
                that.BtnDelBatch = function () {
                    function Obj() {
                        $Core.BtnBase.call(this);
                        this.onBeforeExecute = function (ids, index) { };
                        this.onBeforeExecute = function (ids, index, responseText) { };
                        this.onExecute = function (dg) {
                            $Core.Common.onDel(this, null, dg.id);//内部有前中后事件
                        }
                    }
                    return new Obj();
                }();
                that.BtnImport = function () {
                    function Obj() {
                        $Core.BtnBase.call(this);
                        //导入之前执行事件，设置参数如：param.p1 = abc;param.p2 = 123
                        this.onBeforeExecute = function (param) { },
                        //导入完成之后执行事件，data参数是后台返回的json对象
                        this.onAfterExecute = function (data) { }
                    }
                    return new Obj();
                }();
                that.BtnExport = function () {
                    function Obj() {
                        $Core.BtnBase.call(this);
                        /**
                        *@param{object} param 需要变更或者传递附加参数可对param进行修改
                        */
                        this.onBeforeExecute = function (param) { };
                        this.onExecute = function (dg) {
                            var ifrme = $("#div_ifrme_export"), form_export = $("#form_data");
                            ifrme && ifrme.remove(); form_export && form_export.remove();
                            var objName = dg.tableName;
                            var targetForm = $(".function-box").siblings("div").find('form');
                            var checked_ids = dg.getChecked();
                            var jsonString = JSON.stringify($Core.Common._Internal.buildSearchJson(targetForm));
                            if (checked_ids.length > 0) {
                                var condition = [{ paramName: dg.Internal.primarykey, paramPattern: 'In', paramValue: "(" + checked_ids.join(',') + ")" }];
                                jsonString = JSON.stringify(condition);
                            }
                            //window.open(ajaxOptions.href + '?objName=' + objName + '&sys_search='+jsonString, '_self');      
                            var iframeName = "framePost";
                            ifrme = $("<iframe>").attr("id", "div_ifrme_template").attr("name", iframeName).css({ display: 'none' });
                            form_export = $("<form>").attr("action", $Core.Utility.Ajax.Settings.url).attr("target", iframeName).attr("id", "form_data");
                            var param = {
                                sys_tableName: objName,
                                sys_method: "Export",
                                sys_objName: dg.objName,
                                sys_search: jsonString,
                                sys_mid: $Core.Global.Variable.mid
                            };
                            if (this.onBeforeExecute(param) == false) { return; };
                            for (var k in param) {
                                form_export.append($("<input>").attr("name", k).val(param[k]).attr("type", "hidden"));
                            }
                            //ifrme.append(form_export);//IE 8 有权限限制。
                            $("body").append(ifrme);
                            $("body").append(form_export);
                            form_export[0].submit();
                            form_export.remove();
                            this.onAfterExecute();
                        }
                    }
                    return new Obj();
                }();
                that.BtnExportTemplate = function () {
                    function Obj() {
                        $Core.BtnBase.call(this);
                        /**
                       *@param{object} param 需要变更或者传递附加参数可对param进行修改
                       */
                        this.onBeforeExecute = function (param) { };
                        this.onExecute = function (dg) {
                            var ifrme = $("#div_ifrme_template"), form_export = $("#form_template");
                            ifrme && ifrme.remove(); form_export && form_export.remove();
                            var objName = dg.tableName;
                            //window.open(ajaxOptions.href + '?objName=' + objName + '&sys_search='+jsonString, '_self');
                            var iframeName = "framePost";
                            ifrme = $("<iframe>").attr("id", "div_ifrme_template").attr("name", iframeName).css({ display: 'none' });
                            form_export = $("<form>").attr("action", $Core.Global.route.root).attr("target", iframeName).attr("id", "form_template");
                            var param = {
                                sys_objName: dg.objName,
                                sys_tableName: objName,
                                sys_method: "ExcelTemplate",
                                sys_mid: $Core.Global.Variable.mid
                            };
                            if (this.onBeforeExecute(param) == false) { return; };
                            for (var k in param) {
                                form_export.append($("<input>").attr("name", k).val(param[k]).attr("type", "hidden"));
                            }
                            //ifrme.append(form_export);//IE 8 有权限限制。
                            $("body").append(ifrme);
                            $("body").append(form_export);
                            form_export[0].submit();
                            form_export.remove();
                            this.onAfterExecute();
                        }
                    }
                    return new Obj();
                }();
                function endEditing(dg) {
                    if (dg.PKColumn.Editor.editIndex != null) {
                        var index = dg.PKColumn.Editor.editIndex;
                        dg.PKColumn.Editor.editIndex = null;
                        if (dg.PKColumn.Editor.operator == "Add") {
                            dg.datagrid('deleteRow', index);
                        }
                        else { dg.datagrid('cancelEdit', index); }
                    }
                    return true;
                }
                that.onExecute = function (dg) {
                    if (that.onBeforeExecute() != false) {
                        _createToolBarHtml(dg);
                        that.onAfterExecute();
                    }
                }
            },
            HeaderMenu: function () {
                this.isHidden = false;
                this.Items = [{ "text": "配置", "onclick": "AR.Common._Internal.onConfigClick", "lv2action": "config" }];
                /**
                *向工具条添加按钮
                *@param{string} text 按钮显示的文本
                *@param{string} fname 按钮注册的事件函数名称
                *@param{string} lv2action 二级权限控制，默认值0
                */
                this.add = function (text, fname, lv2action) {
                    this.Items.push({ "text": text, "onclick": fname, "lv2action": lv2action });
                }
            },
            ContextMenu: function () {
                this.isHidden = false;
                this.Items = [{ "text": "添加同级", "onclick": "AR.Common._Internal.onAdd,true", "lv2action": "add" },
                    { "text": "添加子级", "onclick": "AR.Common._Internal.onAdd", "lv2action": "add" },
                    { "text": "编辑", "onclick": "AR.Common._Internal.Editor.onEdit", "lv2action": "edit" },
                    { "text": "删除", "onclick": "AR.Common._Internal.Editor.onDel", "lv2action": "del" }
                ];
                /**
                *向工具条添加按钮
                *@param{string} text 按钮显示的文本
                *@param{string} fname 按钮注册的事件函数名称
                *@param{string} lv2action 二级权限控制，默认值0
                */
                this.add = function (text, fname, lv2action) {
                    this.Items.push({ "text": text, "onclick": fname, "lv2action": lv2action });
                }
            },

            //构建查询条件json格式,search事件调用，返回的Json数组
            buildSearchJson: function (targetForm) {
                var json = [], reg_date = /<=\s('[^']+')/;
                $inputs = targetForm.find("[name]:input[type!=button][type!='reset']");
                $inputs.each(function () {
                    if ($(this).val() == '' || $(this).val() == '请选择' || $(this).val() == null) {
                        return;
                    }
                    var op = 'Like';
                    //因为easyui渲染下拉框后把之前的input影藏
                    if ($(this).attr("type") == 'hidden' && !$("[comboname=" + $(this).attr("name") + "]").attr("multiple")) {
                        op = 'Equal';
                    }
                    var pattern = $("[comboname=" + $(this).attr("name") + "]").attr("pattern");
                    if (pattern) {
                        op = pattern;
                    }
                    //处理多选下拉框的查询语句标记
                    if ($("[comboname=" + $(this).attr("name") + "]").attr("multiple") === 'multiple') {
                        op = 'LikeOr';
                    }
                    var name = $(this).attr("name"), value = $(this).val();
                    var len = json.length;
                    var exist = false;
                    var item;
                    earch: for (var i = 0; i < len; i++) {
                        if (json[i].paramName == name) {
                            if ($("[comboname=" + name + "]").attr('date')) {
                                //json[i].paramValue = "'" + json[i].paramValue + " 00:00:00' AND '" + value + " 23:59:59'";
                                json[i].paramValue = json[i].paramValue.replace(reg_date, " <= '" + value + " 23:59:59'");
                                json[i].paramPattern = 'LikeOr';
                            } else {
                                //json[i].paramValue = "('" + json[i].paramValue + "'" + ',' + "'" + value + "')";
                                //json[i].paramPattern = 'In';
                                json[i].paramValue = json[i].paramValue + "," + value;
                                json[i].paramPattern = op === 'LikeOr' ? 'LikeOr' : 'In';
                            }
                            exist = true;
                            break earch;
                        }
                    }
                    //如果不存在重复的name值，新增项
                    if (!exist) {
                        if ($("[comboname=" + name + "]").attr('date')) {
                            op = "LikeOr";
                            value = name + ' >= \'' + value + ' 00:00:00\' AND ' + name + ' <= \'' + value + ' 23:59:59\''
                        }
                        item = { paramName: name, paramValue: value, paramPattern: op };
                    }
                    if (item) {
                        json.push(item);
                    }
                });
                (function () {
                    for (var i = 0; i < json.length; i++) {
                        if (!json[i].paramValue) { return; }
                        var array = json[i].paramValue.toString().split(',');
                        if (json[i].paramPattern === 'LikeOr') {
                            if (array.length > 1) {
                                var tempArray = new Array();
                                for (var j = 0; j < array.length; j++) {
                                    tempArray.push(json[i].paramName + " LIKE '%" + array[j] + "%'");
                                }
                                json[i].paramValue = tempArray.join(" OR ");
                                tempArray = [];
                            } else if (!reg_date.test(json[i].paramValue)) {
                                json[i].paramPattern = "Equal";
                                //json[i].paramPattern = "Like";
                            }
                        } else if (json[i].paramPattern !== 'LikeOr' && array.length > 1 && (json[i].paramPattern === 'Between' || json[i].paramPattern === 'In')) {
                            json[i].paramPattern = 'Between';
                            json[i].paramValue = array[0] + ' AND ' + array[1];
                        }
                    }
                })()
                return json;
            },
            //查询区域的下拉触发事件
            onQuery: function (dgid) {
                if ($(this).attr('isquery') == "false") {
                    return false;
                }
                if (document.readyState == 'complete') {
                    var dg = $Core.Global.DG.operating;//解决下拉自动事件引发2次查询的问题。
                    if (!dg || dg.Internal.isLoadCompleted) {
                        $(this).parents("form").find(".query").click();
                    }
                }

            },
            onAdd: function (el, dgid, value, index, isSameLevel) {
                var dg = getDgByKey(dgid);
                if (dg) {
                    dg.ToolBar.BtnAdd.onExecute(dg, index, isSameLevel);
                }

            },
            onConfigClick: function (el, dgid, value, index) {
                var dg = getDgByKey(dgid);
                if (dg) {
                    var url = $Core.Utility.stringFormat("{0}?objName={1}", $Core.Global.Variable.ui + '/Web/SysAdmin/config.html', dg.objName);
                    $Core.Global.DG.operating = dg;
                    $Core.Utility.Window.open(url, "", false);
                }
                else { alert("找到不到对象:" + dgid); }
            }
        },
        Formatter: {
            dateFormatter: function (value, row, index) {
                if (value == "") {
                    return "";
                }
                try {
                    var date = new Date(value.replace(/\-/g, '/'));
                    var y = date.getFullYear();
                    if (isNaN(y)) { return value; }
                    var m = date.getMonth() + 1;
                    var d = date.getDate();
                    value = y + '-' + m.toString().replace(/\b(\w)\b/g, '0$1') + '-' + d.toString().replace(/\b(\w)\b/g, '0$1');
                }
                catch (e) {

                }
                return value;
            },
            boolFormatter: function (value, row, index) {
                return "<input type='checkbox' " + (value ? "checked='checked'" : "") + " disabled='disabled' />";
            },
            stringFormatter: function (value, row, index) {
                if (value) {
                    var abValue = value;
                    if (value.length >= 30) {
                        abValue = value.substring(0, 30) + "...";
                    }
                    return '<div title="' + value + '" class="note">' + abValue + '</div>';
                }
                return value;
            },
            configFormatter: function (configKey) {
                return function configFormatter(value, row, index) {
                    var result = value;
                    if (value != undefined && value.toString() != "") {
                        if (configKey && $Core.Global.Config[configKey]) {
                            result = getConfigName(configKey, value);
                        }
                    }
                    result = $Core.Common.Formatter.onAfterConfigFormatter(configKey, result, row, index);
                    if (result && result.toString().indexOf('<') == -1) {
                        result = $Core.Common.Formatter.stringFormatter(result);
                    }
                    return result;
                }
            },
            //本方法仅供重写，可以实现值变更后加链接等效果。
            onAfterConfigFormatter: function (configKey, value, row, index) {
                return value;
            },
            objFormatter: function (objName) {
                var that = this;
                return function objFormatter(value, row, index) {
                    var result = value;
                    if (value != undefined && value.toString() != "") {
                        var _obj = getObj(objName);
                        if ($Core.Global.comboxData && _obj) {
                            result = getNameByValue(_obj, value);
                        }
                    }
                    if (result && result.toString().indexOf('<') == -1) {
                        result = $Core.Common.Formatter.stringFormatter(result);
                    }
                    return result;
                }
            },
            pkFormatter: function (dg) {
                return function (value, row, index) {

                    var btnArray = dg.PKColumn._btnArray;
                    value = row[dg.Internal.primarykey];
                    var result = dg.PKColumn.onBeforeExecute(value, row, index, btnArray);
                    if (result) {
                        return result;
                    }
                    var obj = new $Core.Dictionary();
                    var $div = $('<div class="operation w$len"></div>');
                    var len = 0;
                    var actionKeys = $Core.Global.Variable.actionKeys;
                    if (dg.isEditor == true) {
                        var strTemplate = '<a class="{0}" title="{1}" dgid="' + dg.id + '" onClick="AR.Common._Internal.Editor.{2}(this,\'' + dg.id + '\',\'' + value + '\',' + index + ')"  v="{3}" i="{4}"></a>';
                        if (dg.PKColumn.Editor.editIndex == null) {
                            if (dg.PKColumn.Editor.BtnEdit.hidden != true && actionKeys.indexOf(",edit,") > -1) {
                                len++;
                                var $btn = $($Core.Utility.stringFormat(strTemplate, "bj", "编辑", "onEdit", value, index));
                                $div.append($btn);

                            }
                            if (dg.PKColumn.Editor.BtnDel.hidden != true && actionKeys.indexOf(",del,") > -1) {
                                len++;
                                var $btn = $($Core.Utility.stringFormat(strTemplate, "sc", "删除", "onDel", value, index));
                                obj.set("del", $btn);
                                $div.append($btn);
                            }
                        }
                        else {
                            if (dg.PKColumn.Editor.BtnCancel.hidden != true && actionKeys.indexOf(",edit,") > -1) {
                                len++;
                                var $btn = $($Core.Utility.stringFormat(strTemplate, "cx", "撤销", "onCancel", value, index));
                                obj.set("edit", $btn);
                                $div.append($btn);
                            }
                            if (dg.PKColumn.Editor.BtnSave.hidden != true && actionKeys.indexOf(",edit,") > -1) {
                                len++;
                                var $btn = $($Core.Utility.stringFormat(strTemplate, "bc", "保存", "onSave", value, index));
                                obj.set("edit", $btn);
                                $div.append($btn);
                            }
                        }
                    }
                    for (var i = 0; i < btnArray.length; i++) {
                        var btn = btnArray[i];
                        if (!btn.isHidden && actionKeys.indexOf("," + btn.lv2action + ",") > -1) {
                            if (btn.className != 'sc') {
                                btn.setAttribute("onClick", "AR.Common.onOpen(this,'" + value + "','" + dg.id + "'," + index + ")");
                            } else {
                                btn.setAttribute("onClick", "AR.Common.onDel(this,'" + value + "','" + dg.id + "'," + index + ")");
                            }
                            len++;
                            var $btn = $(btn.outerHTML);
                            obj.set(btn.lv2action || btn.key, $btn);
                            $div.append($btn);
                        }
                    }
                    dg.PKColumn.Items.set(index, obj);
                    var r2 = dg.PKColumn.onAfterExecute(value, row, index, $div);
                    if (r2 == undefined) { return $div.prop("outerHTML").replace('$len', len); }
                    return r2;
                }
            },
            formatEditor: function (row, dg) {
                if (!row.edit) { return; }
                var editor = function () {
                    try {
                        return eval(row.editor);
                    } catch (e) {
                        return undefined;
                    }
                }();
                if (editor) {
                    row.editor = editor.call(dg, row);
                    if (row.editor.type == 'combobox') {
                        row.formatter = function (v, r, i) {
                            var data = row.editor.options.data;
                            var tField = row.editor.options.textField;
                            var vField = row.editor.options.valueField;

                            for (var i = 0; i < data.length; i++) {
                                if (data[i][vField] == v) {
                                    return data[i][tField];
                                }
                            };
                        };
                    }
                } else {
                    var isRelaction = false;
                    var type = 'validatebox', settings = {};
                    if (row.formatter && row.formatter.indexOf('#') != -1) {
                        type = 'combobox';
                        var configKey, objName, data, parentObjName;
                        if ((typeof (row.formatter) == "string" && row.formatter.indexOf('#') != -1) && !/#C_/.test(row.formatter)) {
                            configKey = row.formatter.split('#')[1];
                        }
                        if ((typeof (row.formatter) == "string" && row.formatter.indexOf('#') != -1) && /#C_/.test(row.formatter)) {
                            objName = row.formatter.split('#')[1];
                            if (objName.indexOf('=>') != -1) {
                                var _obj_array = objName.split('=>');
                                objName = _obj_array[0];
                                parentObjName = _obj_array[1];
                                isRelaction = true;
                            }
                        }
                        if (configKey) {
                            data = $Core.Global.Config[configKey] || [];
                        }
                        if (objName) {
                            each: for (var i = 0; i < $Core.Global.comboxData.length; i++) {
                                if ($Core.Global.comboxData[i][objName]) {
                                    data = $Core.Global.comboxData[i][objName];
                                    break each;
                                }
                            }
                        }
                        var isMultiple = false;
                        if (row.rules && row.rules.indexOf('#') != -1) {
                            isMultiple = true;
                        }
                        settings.options = {
                            multiple: isMultiple,
                            valueField: 'value',
                            textField: 'text',
                            objName: objName,
                            parentObjName: parentObjName,
                            OriginalData: data,
                            data: data,
                            onSelect: function (record) {
                                var currentEditor = dg.datagrid("getEditor", { index: dg.PKColumn.Editor.editIndex, field: row.field });
                                var rowEditors = dg.datagrid("getEditors", dg.PKColumn.Editor.editIndex);
                                for (var i = 0, len = rowEditors.length; i < len; i++) {
                                    if (rowEditors[i].type == 'combobox') {
                                        var _parentObjName = rowEditors[i].target.combobox("options").parentObjName;
                                        var _objName = rowEditors[i].target.combobox("options").objName;
                                        var _selfObjName = currentEditor.target.combobox("options").objName;
                                        //找到级联的处理
                                        if (_parentObjName && _parentObjName == _selfObjName) {
                                            //重新加载数据
                                            var subArray = new Array();
                                            (function (key, parent_id) {
                                                var all_array_children;
                                                f1: for (var j = 0; j < $Core.Global.comboxData.length; j++) {
                                                    if ($Core.Global.comboxData[j][key]) {
                                                        all_array_children = $Core.Global.comboxData[j][key];
                                                        break f1;
                                                    }
                                                }
                                                for (var k = 0; k < all_array_children.length; k++) {
                                                    if (all_array_children[k].parent == parent_id) {
                                                        subArray.push(all_array_children[k]);
                                                    }
                                                }
                                            })(_objName, record.value);
                                            rowEditors[i].target.combobox("clear");
                                            rowEditors[i].target.combobox("loadData", subArray);
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        if (row.datatype.indexOf('int') != -1 || row.datatype.indexOf('double') != -1 || row.datatype.indexOf('decimal') != -1) {
                            type = 'numberbox';
                            var prec = row.datatype.split(',')[2];
                            settings.options = {
                                precision: prec,
                                validType: 'number'
                            }
                        }
                        if (row.datatype.indexOf('boolean') != -1) {
                            type = 'checkbox';
                            settings.options = {
                                on: 1,
                                off: 0
                            }
                            row.formatter = function (v, r) {
                                if (v && v == 1) {
                                    return "<input type='checkbox' checked='checked' disabled='disabled' />";
                                }
                                return "<input type='checkbox' disabled='disabled' />";
                            }
                        }
                        if (row.datatype.indexOf('datetime') != -1) {
                            settings.options = {
                                validType: 'datebox'
                            }
                            type = 'datebox';
                        }
                    }
                    settings.type = type;
                    var valid = row.datatype.split(',')[3];
                    if (valid && valid == 1) {
                        settings.options || (settings.options = {});
                        settings.options.required = true;
                        if (!settings.options.validType) {
                            var len = row.datatype.split(',')[1];
                            if (len != 0) {
                                settings.options.validType = 'length[1,' + len + ']';
                            }
                        }
                    }
                    row.editor = settings;
                }
            },
            //对默认表头进行处理分组。
            formatHeader: function (dg) {
                var json_data = $Core.Utility.cloneArray(dg.Internal.headerData, true);
                var frozen = Array(), cols = Array(), merge = Array(), isMerge = false, megerLen = 0, startIndex = 0;
                each: for (var i = 0; i < json_data.length; i++) {
                    var format, style, configKey, objName;
                    //格式化第一列为主键
                    if (i == 0 && (json_data[i].formatter == undefined || json_data[i].formatter == "#" || json_data[i].formatter == "")) {
                        frozen.push({ align: 'center', checkbox: dg.isShowCheckBox, hidden: !dg.isShowCheckBox, field: 'ckb' });

                        dg.Internal.primarykey = json_data[i].field;
                        // dg.Internal.idField = json_data[i].field;
                        if (!dg.PKColumn.isHidden && (dg.PKColumn._btnArray.length > 0 || dg.isEditor)) {
                            //检测操作列，权限过滤后还有没有可呈现的控件。
                            var actionKeys = $Core.Global.Variable.actionKeys;
                            var len = 0;
                            for (var k = 0; k < dg.PKColumn._btnArray.length; k++) {
                                if (actionKeys.indexOf("," + dg.PKColumn._btnArray[k].lv2action + ",") > -1) {
                                    len++;
                                }
                            }
                            if (dg.isEditor) {
                                actionKeys.indexOf(",edit,") > -1 && len++;
                                actionKeys.indexOf(",del,") > -1 && len++;
                            }
                            if (len > 0) {
                                var pkColumn = $Core.Utility.cloneObject(json_data[i]);
                                pkColumn.formatter = this.pkFormatter(dg);
                                //if (dg.isEditor) {
                                //    var len = dg.PKColumn._btnArray.length;
                                //    pkColumn.width = len == 0 ? 2 * 26 : (2 + len) * 26;
                                //} else { pkColumn.width = dg.PKColumn._btnArray.length * 26; }
                                pkColumn.width = len * 32;
                                delete pkColumn.rowspan;
                                delete pkColumn.colspna;
                                pkColumn.hidden = false;
                                var title = getConfigValue("SysConfig", "OperatorTitle");
                                if (!title) {
                                    title = '操作';
                                }
                                pkColumn.title = title == "空" ? '' : title;
                                pkColumn.field = 'auto_pk';
                                frozen.push(pkColumn);
                            }
                        }
                    }

                    if (json_data[i].hidden && json_data[i].colspan < 2) {
                        continue each;
                    }
                    //是否编辑模式
                    if ((dg.isEditor && json_data[i].edit) || dg.type == "treegrid") {
                        this.formatEditor(json_data[i], dg);
                        //var row = json_data[i];
                        //if (row && row.editor && row.editor.options && row.editor.type == "combobox") {
                        //    var isrelaciton = false;
                        //    if ((typeof (row.formatter) == "string" && row.formatter.indexOf('#') != -1) && /#C_/.test(row.formatter)) {
                        //        objName = row.formatter.split('#')[1];
                        //        if (objName.indexOf('=>') != -1) {
                        //            isrelaciton = true;
                        //        }
                        //    }
                        //}
                    }
                    if (json_data[i].formatter && typeof (json_data[i].formatter) != 'function') {
                        //格式化config表的数据结构
                        if (json_data[i].formatter && json_data[i].formatter.length > 2 && json_data[i].formatter.indexOf('#') != -1 && !/C_+/.test(json_data[i].formatter)) {
                            configKey = json_data[i].formatter.split('#')[1];
                            json_data[i].formatter = $Core.Common.Formatter.configFormatter;
                        }

                        if (json_data[i].formatter && json_data[i].formatter.length > 2 && json_data[i].formatter.indexOf('#') != -1 && /C_+/.test(json_data[i].formatter)) {
                            objName = json_data[i].formatter.split('#')[1];
                            if (objName.indexOf('=>') != -1) {
                                objName = objName.split('=>')[0];
                            }
                            json_data[i].formatter = $Core.Common.Formatter.objFormatter;
                        }
                    }
                    try {
                        format = $Core.Common.Formatter[json_data[i].formatter] || eval(json_data[i].formatter);
                        if (format == undefined) {
                            delete json_data[i].formatter;
                            delete json_data[i].styler;
                        }
                        style = eval(json_data[i].styler);
                        if (typeof (format) == "function") {
                            if (json_data[i].formatter == $Core.Common.Formatter.configFormatter) {
                                json_data[i].formatter = format(configKey);
                            } else if (json_data[i].formatter == $Core.Common.Formatter.objFormatter) {
                                json_data[i].formatter = format(objName);
                            } else {
                                if (i == 0) {
                                    dg.Internal.primarykey = json_data[i].field;
                                    //dg.Internal.idField = json_data[i].field;
                                    json_data[i].formatter = format(dg);
                                } else {
                                    json_data[i].formatter = format;
                                }
                            }
                        }
                        if (typeof (style) == "function") {
                            json_data[i].styler = style;
                        }
                        //处理跨行跨列
                        var rowspan = parseInt(json_data[i].rowspan) || 1;
                        var colspan = parseInt(json_data[i].colspan) || 1;
                        json_data[i].rowspan = rowspan == 0 ? 1 : rowspan;
                        json_data[i].colspan = colspan == 0 ? 1 : colspan;
                    } catch (e) {
                        delete json_data[i].formatter;
                        delete json_data[i].styler;
                    }

                    json_data[i].sortable = eval(json_data[i].sortable);
                    json_data[i].hidden = eval(json_data[i].hidden);
                    if (i == 0 || json_data[i].frozen)// (i == 0)
                    {
                        delete json_data[i].rowspan;
                        delete json_data[i].colspna;
                        frozen.push(json_data[i]);
                    }
                    else {
                        if (json_data[i].field.indexOf('mg_') != -1) {
                            delete json_data[i].field;
                        }
                        var _index = (json_data[i].mergeindex || 1) - 1;
                        var _array = cols[_index] || new Array();
                        _array.push(json_data[i]);
                        cols[_index] = _array;
                    }
                }
                for (var j = 0, len = cols.length; j < len; j++) {
                    if (cols[j]) {
                        for (var k = 0, len1 = cols[j].length; k < len1; k++) {
                            if (cols[j][k].field && cols[j][k].rowspan == 1) {
                                cols[j][k].rowspan = len;
                            }
                        }
                    }
                }
                return { frozen: frozen, cols: cols };
            }
        },

        onDel: function (el, value, thatID, index) {
            var dg = $Core.Global.DG.Items[thatID];
            dg.PKColumn._onDel(el, value, thatID, index);
        },
        /*onOpen与delRow归属于window对象，
            可在当前调用页面重写这两个方法，
            如果没有别的业务需求不建议重写
        */
        //打开业务页面
        onOpen: function (el, value, thatID, index) {
            var dg = $Core.Global.DG.operating = $Core.Global.DG.Items[thatID]; //赋值当前对象到page属性方便调用
            dg.PKColumn._onOpen(el, value, thatID, index);
        },

    }

    //创建搜索区
    function _createSearchAreaHtml(dg) {
        var dataArray = [];
        var hdata = dg.Internal.headerData;
        for (var i = 0, len = hdata.length; i < len; i++) {
            if (hdata[i].search) {
                dataArray.push(hdata[i]);
            }
        }
        if (dataArray.length > 0 || dg.Search.$target) {
            var $input = $('<div id="div_search">').addClass('box w684');
            if (!dg.Search.$target) {
                $Core.Utility.createInputHtml($input, dataArray, dg, true);
            }
            else {
                $input = dg.Search.$target;
                $input.show();
            }
            dg.Search.$target = $('<div id="' + dg.id + '_SearchArea" class="cont-list-form cont-box-form">');
            var form = $("<form>");
            dg.Search.$target.append(form);
            form.append($input);

            var divButtons = $('<div class="btn w72">');
            dg.Search.BtnQuery.$target = $('<input class="query" value="" type="button" />');
            dg.Search.BtnReset.$target = $('<input class="reset" type="reset" value="" />');
            //需要指定按钮对象，如果样式不对将不触发事件
            if (!dg.Search.BtnQuery.isHidden) {
                divButtons.append($("<a>").append(dg.Search.BtnQuery.$target));
            }
            if (!dg.Search.BtnReset.isHidden) {
                divButtons.append($("<a>").append(dg.Search.BtnReset.$target));
            }
            form.append(divButtons);
        }
        dg.ToolArea.$target.append(dg.Search.$target);

    };
    //创建工具栏区
    function _createToolBarHtml(dg) {
        //var div_fn = $('<div class="function-box" id="' + dg.id + '_ToolbarArea">');
        //if (!dg.ToolBar.isHidden) {
        //div_fn.attr("class", "function-box");
        //if (dg.type == "datagrid") {

        var item; actionKeys = $Core.Global.Variable.actionKeys || "";
        if (actionKeys.indexOf(',add,') > -1 && !dg.ToolBar.BtnAdd.isHidden) {
            dg.ToolBar.BtnAdd.$target = $('<input class=\"add\" flag=\"btn_add\" type=\"button\" name=\"添加\" value=\"\"/>');
            item = $("<a>").append(dg.ToolBar.BtnAdd.$target);
            dg.ToolBar.$target.append(item);
            dg.ToolBar.Items.set("add", dg.ToolBar.BtnAdd);
        }
        if (actionKeys.indexOf(',del,') > -1 && !dg.ToolBar.BtnDelBatch.isHidden && dg.isShowCheckBox) {
            dg.ToolBar.BtnDelBatch.$target = $('<input  class=\"batch_del\" flag=\"btn_del\" type=\"button\" name=\"批量删除\" value=\"\"/>').attr("dgID", dg.id);
            item = $("<a>").append(dg.ToolBar.BtnDelBatch.$target);
            dg.ToolBar.$target.append(item);
            dg.ToolBar.Items.set("del", dg.ToolBar.BtnDelBatch);
        }
        if (actionKeys.indexOf(',export,') > -1 && !dg.ToolBar.BtnExport.isHidden) {
            dg.ToolBar.BtnExport.$target = $('<input class=\"export\" flag=\"btn_export\" type=\"button\"  value=\"\"/>');
            item = $("<a>").append(dg.ToolBar.BtnExport.$target);
            dg.ToolBar.$target.append(item);
            dg.ToolBar.Items.set("export", dg.ToolBar.BtnExport);
        }
        if (actionKeys.indexOf(',import,') > -1) {
            if (!dg.ToolBar.BtnImport.isHidden) {
                dg.ToolBar.BtnImport.$target = $('<input class=\"import\" flag=\"btn_import\" type=\"button\"  value=\"\"/>');
                item = $("<a>").append(dg.ToolBar.BtnImport.$target);
                dg.ToolBar.$target.append(item);
                dg.ToolBar.Items.set("import", dg.ToolBar.BtnImport);
            }
            if (!dg.ToolBar.BtnExportTemplate.isHidden) {
                dg.ToolBar.BtnExportTemplate.$target = $('<input class=\"btn-sm\" flag=\"btn_export_template\" type=\"button\"  value=\"导出模板\"/>');
                item = $("<a>").append(dg.ToolBar.BtnExportTemplate.$target);
                dg.ToolBar.$target.append(item);
                dg.ToolBar.Items.set("exportTemplate", dg.ToolBar.BtnExportTemplate);
            }
        }
        //}
        //else {//处理样式问题（如果去掉或隐藏div_fn，或不设置class为function-box，都显示不出分页控件，只有后期改变其属性）
        //    div_fn.attr("style", "height:0px;padding:0 0;border-bottom:0px");
        //}
        //dg.ToolBar.$target = div_fn;
        //dg.ToolArea.$target.append(dg.ToolBar.$target);
        _createCustomButton(dg);
    }
    //创建自定义工具条。
    function _createCustomButton(dg) {
        var btnArray = dg.ToolBar._btnArray;
        if (!(btnArray instanceof Array)) {
            throw TypeError('参数必须是一个数组');
        }
        var hiddenCount = 0;
        var actionKeys = $Core.Global.Variable.actionKeys;
        for (var i = 0, len = btnArray.length; i < len; i++) {
            if (btnArray[i] == undefined) { continue; }
            var lv2action = btnArray[i].lv2action && btnArray[i].lv2action.toLowerCase();
            if (!lv2action || actionKeys.indexOf(',' + lv2action + ",") > -1) {
                var index = btnArray[i].index;
                var btn = btnArray[i].btn,
                    item = '';
                if (btn.html) {
                    item = btn.html;
                } else {
                    var btnClass = btn.css || "btn-sm";
                    var btnClick = btn.click;
                    var title = btn.title;
                    item = $Core.Utility.stringFormat('<a><input class=\"{0}\" type=\"button\" onClick=\"{1}(event)\"  value=\"{2}\"/></a>', btnClass, btnClick, title);
                }
                item = $(item);
                var toolbarContainer = $("#" + dg.ToolArea.id).find(".function-box"),
                    count = toolbarContainer.children().length;
                if (count == 0) {
                    toolbarContainer.append(item);
                } else {
                    if (count < index) {
                        index = count;
                        toolbarContainer.children().eq(index - 1).after(item);
                    } else {
                        toolbarContainer.children().eq(index - 1).before(item);
                    }
                }
                //外部是_createToolbar.call(dg, dg.ToolBar._btnArray);调用方式，所以上下文被换成了datagrid
                dg.ToolBar.Items.set(lv2action || title || btnClick, { "isCustom": true, $target: item });
            }
        }
    }
    function getObj(objName) {
        var obj = new Object();
        var comboxData = $Core.Global.comboxData;
        for (var i = 0; i < comboxData.length; i++) {
            if (comboxData[i][objName]) {
                obj = comboxData[i][objName];
                break;
            }
        }
        return obj;
    };
    function getNameByValue(obj, v) {
        var value = v;
        if ($.type(obj) == "object") {
            obj = [obj];
        }
        if (v.toString().indexOf(',') != -1) {
            var array = v.split(','), result = [];
            for (var i = 0; i < obj.length; i++) {
                if (array.contains(obj[i]['value'])) {
                    result.push(obj[i]['text']);
                }
            }
            if (result.length > 0) {
                value = result.join(',');
            }
        } else {
            for (var i = 0; i < obj.length; i++) {
                if (obj[i]['value'] == v) {
                    value = obj[i]['text'];
                    break;
                }
            }
        }
        return value;
    };
    function getConfigName(configKey, value) {
        var items = $Core.Global.Config[configKey];
        var itemValue = [];
        if (items != undefined && value != undefined && value != null && value.toString() != '') {
            var valueArray = value.toString().split(',');
            var isIn = false;
            for (var i = 0; i < items.length; i++) {
                isIn = valueArray.contains(items[i].value);
                if (!isIn) {
                    var iValue = items[i].value.toString();
                    if (iValue == "1" || iValue == "0") {
                        isIn = valueArray.contains(iValue == "1" ? true : false);
                    }
                    else if (iValue == "true" || iValue == "false") {
                        isIn = valueArray.contains(iValue == "true" ? 1 : 0);
                    }
                }
                if (isIn) {
                    itemValue.push(items[i].text);
                }

            }
            return itemValue.length == 0 ? value : itemValue.join(',');
        } else {
            return '';
        }
    };

    function getConfigValue(configKey, text) {
        var items = $Core.Global.Config[configKey];
        var itemValue = [];
        if (items != undefined && text != undefined && text != null && text.toString() != '') {
            var valueArray = text.toString().split(',');
            for (var i = 0; i < items.length; i++) {
                if (valueArray.contains(items[i].text)) {
                    itemValue.push(items[i].value);
                }
            }
            return itemValue.length == 0 ? text : itemValue.join(',');
        }
        else {
            return '';
        }
    };
    function getDgByKey(key) {
        return $Core.Global.DG.Items[key];
    }

})(jQuery, AR);

