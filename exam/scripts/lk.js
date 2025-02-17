'use strict';

const BASE_URL = new URL("http://exam-2023-1-api.std-900.ist.mospolytech.ru/");
const API_KEY = "4a28530d-b04d-47df-855c-72a23e662940";

const varToString = varObj => Object.keys(varObj)[0].toLowerCase();

const getGid = async (gidId) => {
    let endpoint = new URL(`api/guides/${gidId}`, BASE_URL);
    endpoint.searchParams.set(varToString({API_KEY}), API_KEY);
    let response = await fetch(endpoint);
    if (response.ok) {
        let data = await response.json();
        if ("error" in data) throw new Error(data.error);
        else {
            return data;
        }
    } else throw new Error(
        `${response.status}: ${(await response.json()).error}`
    );
};

const getPath = async (pathId) => {
    let endpoint = new URL(`api/routes/${pathId}`, BASE_URL);
    endpoint.searchParams.set(varToString({API_KEY}), API_KEY);
    let response = await fetch(endpoint);
    if (response.ok) {
        let data = await response.json();
        if ("error" in data) throw new Error(data.error);
        else {
            return data;
        }
    } else throw new Error(
        `${response.status}: ${(await response.json()).error}`
    );
};

const getOrders = async () => {
    let endpoint = new URL(`api/orders`, BASE_URL);
    endpoint.searchParams.set(varToString({API_KEY}), API_KEY);
    let response = await fetch(endpoint);
    if (response.ok) {
        let data = await response.json();
        if ("error" in data) throw new Error(data.error);
        else {
            return data;
        }
    } else throw new Error(
        `${response.status}: ${(await response.json()).error}`
    );
};

const getOrder = async (orderId) => {
    let endpoint = new URL(`api/orders/${orderId}`, BASE_URL);
    endpoint.searchParams.set(varToString({API_KEY}), API_KEY);
    let response = await fetch(endpoint);
    if (response.ok) {
        let data = await response.json();
        if ("error" in data) throw new Error(data.error);
        else {
            data.time = data.time.split(':').slice(0, 2).join(':');
            return data;
        }
    } else throw new Error(
        `${response.status}: ${(await response.json()).error}`
    );
};

const editOrder = async (id, data) => {
    let endpoint = new URL(`api/orders/${id}`, BASE_URL);
    endpoint.searchParams.set(varToString({API_KEY}), API_KEY);
    let response = await fetch(
        endpoint,
        {
            method: "PUT",
            body: data,
            mode: "cors"
        }
    );
    if (response.ok) {
        let data = await response.json();
        if ("error" in data) throw new Error(data.error);
        else {
            return data;
        }
    } else throw new Error(
        `${response.status}: ${(await response.json()).error}`
    );
};

const deleteOrder = async (orderId) => {
    let endpoint = new URL(`api/orders/${orderId}`, BASE_URL);
    endpoint.searchParams.set(varToString({API_KEY}), API_KEY);
    let response = await fetch(endpoint, {
        method: "DELETE"
    });
    if (response.ok) {
        let data = await response.json();
        if (Number.isInteger(data.id)) return data.id;
        else {
            throw new Error(data.error);
        }
    } else throw new Error(
        `${response.status}: ${(await response.json()).error}`
    );
};

const STATE = {
    orders: [],
    totalPages: 0,
    perPage: 5,
    currentPage: 1,
    selectedOrder: null
};

const DayOfs = [
    [1, 2, 3, 4, 5, 6, 7, 8],
    [23],
    [8],
    [29, 30],
    [1, 9, 10],
    [12],
    [],
    [],
    [],
    [],
    [4],
    [30, 31],
];

const showMessage = async (title, message, type = "alert-success") => {
    let alert = document.getElementById(
        "alert-template"
    ).content.firstElementChild.cloneNode(true);
    const stitle = document.createElement("strong");
    stitle.innerHTML = title;
    alert.querySelector(".msg").innerHTML = `${stitle.outerHTML} ${message}`;
    alert.classList.add(type);
    setTimeout(()=>alert.remove(), 5000);
    document.querySelector('.messages').append(alert);
};

const fillOrders = async (orders) => {
    const ORDERS_BODY = document.getElementById("order_body");
    ORDERS_BODY.innerHTML = "";
    let index = (STATE.currentPage - 1) * STATE.perPage;
    for (let i = index; i < index + STATE.perPage 
        && i < orders.length; i++) {
        let orderNode = document.querySelector('#order').content
            .firstElementChild.cloneNode(true);
        orderNode.children[0].innerHTML = i + 1;
        orderNode.children[1].innerHTML = orders[i].path.name;
        orderNode.children[2].innerHTML = orders[i].date;
        orderNode.children[3].innerHTML = orders[i].price;
        orderNode.id = orders[i].id;
        ORDERS_BODY.append(orderNode);
    }
};

const loadOrders = async () => {
    try {
        let orders = await getOrders();
        STATE.orders = [];
        for (let order of orders) {
            let path = await getPath(order.route_id);
            order.path = path;
            STATE.orders.push(order);
        }
        STATE.totalPages = ((STATE.orders.length / STATE.perPage) | 0)
            + (STATE.orders.length % STATE.perPage == 0 ? 0 : 1);
        await fillOrders(orders);
    } catch (e) {
        showMessage("Ошибка!", err.message, "alert-danger");
    }
};

const isMorning = async (time) => {
    const start = new Date(Date.now());
    start.setHours(9);
    start.setMinutes(0);
    const end = new Date(Date.now());
    end.setHours(12);
    end.setMinutes(0);
    const now = new Date(Date.now());
    let hm = time.split(':');
    now.setHours(hm[0]);
    now.setMinutes(hm[1]);
    return now >= start && now <= end ? 400 : 0;
};

const isEvening = async (time) => {
    const start = new Date(Date.now());
    start.setHours(20);
    start.setMinutes(0);
    const end = new Date(Date.now());
    end.setHours(23);
    end.setMinutes(0);
    const now = new Date(Date.now());
    let hm = time.split(':');
    now.setHours(hm[0]);
    now.setMinutes(hm[1]);
    return now >= start && now <= end ? 1000 : 0;
};

const numberOfVisitors = async (number) => {
    if (number >= 1 && number <= 5) return 0;
    else if (number > 5 && number <= 10) return 1000;
    else if (number > 10 && number <= 20) return 1500;
    else return null;
};

const isDayOf = async (date) => {
    const now = new Date(date);
    let flag = false;
    if (now.getDay() == 0 || now.getDay() == 6) flag = true;
    if (DayOfs[now.getMonth()].indexOf(now.getDate()) != -1) flag = true;
    return flag ? 1.5 : 1;
};

const valudateTime = async (time) => {
    if (document.getElementById("acceptable-time")
        .querySelector(`[value="${time}"]`) == null) return false;
    const start = new Date(Date.now());
    start.setHours(9);
    start.setMinutes(0);
    const end = new Date(Date.now());
    end.setHours(23);
    end.setMinutes(0);
    const now = new Date(Date.now());
    let hm = time.split(':');
    now.setHours(hm[0]);
    now.setMinutes(hm[1]);
    if (now < start || now > end) return false;
    else return true;
};

const validateDate = async (date) => {
    const now = new Date(Date.now());
    const targ = new Date(date);
    if (targ < now) return false;
    else return true;
};

const option1 = async () => {
    let interactive = document.getElementById('int');
    if (interactive.checked) return 1.5;
    else return 1;
};

const option2 = async (number) => {
    let surd = document.getElementById('surd');
    if (!surd.checked) return 1;
    if (number >= 1 && number <= 5) return 1.15;
    else if (number > 5 && number <= 10) return 1.25;
    else return null;
};

const formula = async () => {
    let ma1 = document.getElementById('ma1');
    let ma2 = document.getElementById('ma2');
    let ma3 = document.getElementById('ma3');
    let ma4 = document.getElementById('ma4');
    if (ma1.value == '' || ma2.value == '' || ma4.value == '') 
        throw new Error("Одно из полей не заполнено");
    if (!await valudateTime(ma2.value) || !await validateDate(ma1.value))
        throw new Error("Время или дата некорректны.");
    let number = await numberOfVisitors(ma4.value);
    if (number == null) throw new Error("Размер группы должен быть от 1 до 20");
    let price = STATE.selectedOrder.gid.pricePerHour * ma3.value *
        await isDayOf(ma1.value) + await isMorning(ma2.value) +
        await isEvening(ma2.value) + number;
    price *= await option1();
    price *= await option2(ma4.value);
    if (price == 0) throw new Error("Сурдопереводчик работает только с "
        + "группами до 10 человек");
    return Math.ceil(price);
};

const modalOpen = async (e) => {
    try {
        let id = e.relatedTarget.closest("tr").id;
        let order = await getOrder(id);
        let path = await getPath(order.route_id);
        let gid = await getGid(order.guide_id);
        order.gid = gid;
        order.path = path;
        STATE.selectedOrder = order;
        document.getElementById("gid-name").innerHTML = gid.name;
        document.getElementById("path-name").innerHTML = path.name;
        document.getElementById("ma1").value = order.date;
        document.getElementById("ma2").value = order.time;
        document.getElementById("ma3").value = order.duration;
        document.getElementById("ma4").value = order.persons;
        document.getElementById("int").checked = order.optionFirst;
        document.getElementById("surd").checked = order.optionSecond;
        document.getElementById("cost").innerHTML = order.price;
    } catch (e) {}
};

const modalShow = async (e) => {
    try {
        let id = e.relatedTarget.closest("tr").id;
        let order = await getOrder(id);
        let path = await getPath(order.route_id);
        let gid = await getGid(order.guide_id);
        let intC = document.getElementById("int_c").classList;
        let surdC = document.getElementById("surd_c").classList;
        if (intC.contains("visually-hidden")) intC.remove("visually-hidden");
        if (surdC.contains("visually-hidden")) surdC.remove("visually-hidden");
        document.getElementById("sgid-name").innerHTML = gid.name;
        document.getElementById("spath-name").innerHTML = path.name;
        document.getElementById("sma1").value = order.date;
        document.getElementById("sma2").value = order.time;
        switch (order.duration) {
        case 1:
            document.getElementById("sma3").value = "1 час";
            break;
        case 2:
            document.getElementById("sma3").value = "2 часа";
            break;
        case 3:
            document.getElementById("sma3").value = "3 часа";
            break;
        }
        document.getElementById("sma4").value = order.persons;
        if (!order.optionFirst) intC.add("visually-hidden");
        if (!order.optionSecond) surdC.add("visually-hidden");
        document.getElementById("scost").innerHTML = order.price;
    } catch (e) {}
};

const modalDelete = async (e) => {
    try {
        let id = e.relatedTarget.closest("tr").id;
        let order = await getOrder(id);
        STATE.selectedOrder = order;
    } catch (e) {}
};

const changeCost = async (e) => {
    try {
        switch (e.target.id) {
        case "ma1":
        case "ma2":
        case "ma3":
        case "ma4":
        case "int":
        case "surd":
            if (document.getElementById("ma4").value > 10) {
                let surd = document.getElementById("surd");
                surd.checked = false;
                surd.disabled = true;
            } else document.getElementById("surd").disabled = false;
            let cost = document.getElementById("cost");
            let forml = await formula();
            cost.innerHTML = forml;
            break;
        }
    } catch (e) {
        document.getElementById("cost").innerHTML = 0;
    }
};

const onSumbitClick = async (e) => {
    try {
        let int = document.getElementById('int').checked;
        let surd = document.getElementById('surd').checked;
        let cost = await formula();
        let form = e.target.closest('.modal-content').querySelector('form');
        let formData = new FormData(form);
        formData.set("route_id", STATE.selectedOrder.path.id);
        formData.set("guide_id", STATE.selectedOrder.gid.id);
        formData.set("price", cost);
        formData.set("optionFirst", int ? 1 : 0);
        formData.set("optionSecond", surd ? 1 : 0);
        await editOrder(STATE.selectedOrder.id, formData);
        STATE.selectedOrder = null;
        form.reset();
        await loadOrders();
        await showMessage("Успех!", "Заявка отредактирована");
    } catch (e) {
        showMessage("Ошибка!", e.message, "alert-danger");
    }
};

const onDeleteClick = async (e) => {
    try {
        await deleteOrder(STATE.selectedOrder.id);
        STATE.currentPage = 1;
        STATE.selectedOrder = null;
        await loadOrders();
        await showMessage("Успех!", "Заявка удалена");
    } catch (e) {
        showMessage("Ошибка!", e.message, "alert-danger");
    }
};

const goToPage = async (pageNum) => {
    STATE.currentPage = pageNum;
    await fillOrders(STATE.orders);
};

const numeration = async () => {
    document.getElementById("prev").classList
        .remove("visually-hidden");
    document.getElementById("next").classList
        .remove("visually-hidden");
    let first = Math.max(1, STATE.currentPage - 2);
    let btnp = document.getElementById('btn-p');
    let last = Math.min(STATE.currentPage + 2, STATE.totalPages);
    btnp.innerHTML = "";
    for (let i = first; i <= last; i++) {
        let btn = document.createElement("button");
        btn.innerHTML = i;
        btn.onclick = async () => await goToPage(i);
        btn.setAttribute("class", "btn btn-secondary");
        btnp.append(btn);
    }
    for (let btn of btnp.children) {
        if (btn.innerHTML == STATE.currentPage) 
            btn.setAttribute("class", "btn btn-primary");
    }
    if (STATE.currentPage == 1) document.getElementById("prev")
        .classList.add("visually-hidden");
    if (STATE.currentPage == STATE.totalPages) document.getElementById("next")
        .classList.add("visually-hidden");
};

const getNearPage = async (shift) => {
    STATE.currentPage += shift;
    await fillOrders(STATE.orders);
};

const updateToooltip = async () => {
    let tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
};

window.onload = async () => {
    try {
        const callback = (mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === "childList") {
                    numeration();
                }
            }
        };
        const observer = new MutationObserver(callback);
        observer.observe(document.getElementById("order_body"),
            { attributes: false, childList: true, subtree: false }
        );
        await loadOrders();
        document.getElementById("order_body").onclick = async (e) => {
        };
        document.getElementById('ModalEdit').addEventListener(
            "show.bs.modal", modalOpen);
        document.getElementById('ModalEdit').addEventListener(
            "change", changeCost
        );
        document.getElementById('ex_edit').onclick = onSumbitClick;
        document.getElementById('ModalDelete').addEventListener(
            "show.bs.modal", modalDelete);
        document.getElementById('ex_delete').onclick = onDeleteClick;
        document.getElementById('ModalShow').addEventListener(
            "show.bs.modal", modalShow);
        document.getElementById("prev").onclick = async (e) => 
            await getNearPage(-1);
        document.getElementById("next").onclick = async (e) => 
            await getNearPage(1);
        await updateToooltip();
    } catch (e) {}
};
