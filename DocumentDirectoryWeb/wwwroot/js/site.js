﻿// Открывает окно просмотра документа.
function openDocument(pdfUrl, documentId, isReviewed) {
    const pdfIframe = document.getElementById('pdf-iframe');
    pdfIframe.src = pdfUrl;

    $('#document-id').val(documentId);
    $('#agreement-checkbox').prop("checked", convertToJSBool(isReviewed));

    $('#pdf-modal').modal('show');
}

// Функция отображения вкладок для документов.
function showCategoryTabs() {
    $.ajax({
        url: "/DocumentView/GetCategories",
        type: "GET",
        success: function (response) {
            const tabs = $('#categoryTabs');
            tabs.html(response);
        },
        error: function (error) {
            console.log(error);
            alert("Произошла ошибка при загрузке данных.");
        }
    });
}

// Функция открытия модального окна.
function openModal(url, id) {
    $.ajax({
        url: url,
        type: "GET",
        data: {id: id},
        success: function (response) {
            let modal = $('#modalWindow');
            modal.html(response);
            modal.modal('show');
        },
        error: function (error) {
            console.log(error);
            alert("Произошла ошибка при загрузке данных.");
        }
    });
}

// Функция для создания новой записи.
function createItem(controllerName) {
    openModal('/' + controllerName + '/CreateItem', '-1');
}

// Функция для изменения записи по идентификатору.
function editItem(controllerName, id) {
    openModal('/' + controllerName + '/GetItem', id);
}

// Функция для удаления записи по идентификатору.
function deleteItem(controllerName, id, reload = false) {
    if (confirm("Вы уверены, что хотите удалить эту запись?")) {
        $.ajax({
            url: '/' + controllerName + '/DeleteItem',
            type: "POST",
            data: {id: id},
            success: function () {
                refreshTableData(controllerName);
                alert("Запись успешно удалена.");
                if (reload) {
                    location.reload(); // Перезагрузка страницы
                }
            },
            error: function (error) {
                console.log(error);
                alert("Произошла ошибка при удалении записи.");
            }
        });
    }
}

// Функция для поиска в таблице
function filterTable() {
    let searchText = $("#searchInput")
        .val().trim().toLowerCase();
    let rows = $("#dataTable tbody tr");

    rows.each(function () {
        let row = $(this);
        let showRow = false;
        row.find("td").each(
            function () {
                let cellText = $(this).text().toLowerCase();
                if (cellText.includes(searchText)) {
                    showRow = true;
                    return false;
                }
            });
        if (showRow) {
            row.show();
        } else {
            row.hide();
        }
    });
}

// Функция для очистки поля поиска.
function clearInputFilter() {
    $("#searchInput").val("").focus();
    filterTable();
}

// Функция для обработки события клика на заголовке столбца.
function handleSortClick(controllerName, current) {
    // Удаляем классы сортировки у всех столбцов
    $("#dataTable th a").removeClass("active-sort");

    let sortBy = current.data("sort-by");
    let currentSortDirection = current.data("sort-direction");

    // Устанавливаем класс сортировки для текущего столбца
    current.addClass("active-sort");

    // Меняем направление сортировки
    let newSortDirection = currentSortDirection === "asc" ? "desc" : "asc";

    // Обновляем данные таблицы через AJAX
    refreshTableData(controllerName, sortBy, newSortDirection);

    // Обновляем значения атрибутов data-sort-direction
    current.data("sort-direction", newSortDirection);
}

// Функция для обновления данных таблицы через AJAX.
function refreshTableData(controllerName, sortBy = null, sortDirection = null) {
    if (sortBy == null || sortDirection == null) {
        // Получаем текущие значения сортировки
        let currentSortColumn = $("#dataTable th a.active-sort");
        sortBy = currentSortColumn.data("sort-by");
        sortDirection = currentSortColumn.data("sort-direction");
    }

    let table = $("#dataTable tbody");

    $.ajax({
        url: '/' + controllerName + '/GetSortedData',
        type: "GET",
        data: {
            sortBy: sortBy,
            sortDirection: sortDirection
        },
        success: function (data) {
            table.html(data);
        },
        error: function (error) {
            console.log(error);
            alert("Произошла ошибка при обновлении данных.");
        }
    });

    $("#searchInput").val("");
}

// Функция для проверки данных на уникальность.
function checkUnique(controllerName, excludedFields = []) {
    let fieldTags = ['input', 'textarea', 'select'];
    let formData = {};

    fieldTags.forEach(function (tag) {
        $('form ' + tag).each(function () {
            let fieldName = $(this).attr('name');

            // Проверяем, что имя поля не содержится в исключенных полях
            if (!excludedFields.includes(fieldName)) {
                formData[fieldName] = $(this).val();
            }
        });
    });

    let formAlert = $('#formAlert');
    let data = JSON.stringify(formData);

    $.ajax({
        url: '/' + controllerName + '/CheckUnique',
        type: 'POST',
        contentType: 'application/json',
        data: data,
        success: function (result) {
            if (result.isUnique && result.isValid) {
                formAlert.hide();
                $('form').unbind('submit').submit();
            } else if (!result.isValid) {
                formAlert.text('Поля неправильно заполнены!');
                formAlert.show();
            } else if (!result.isUnique) {
                formAlert.text('Запись с такими данными уже существует!');
                formAlert.show();
            }
        },
        error: function (error) {
            console.log(error);
            alert("Произошла ошибка при отправке данных.");
        }
    });
}

// Функция для конвертации bool.
function convertToJSBool(csharpBool) {
    if (!csharpBool) return false;

    // Преобразование строки в нижний регистр и сравнение с "true"
    return csharpBool.toLowerCase() === "true";
}
