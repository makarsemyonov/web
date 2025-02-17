'use strict';

const BASE_URL = new URL("http://exam-2023-1-api.std-900.ist.mospolytech.ru/");
const API_KEY = "";

const varToString = varObj => Object.keys(varObj)[0].toLowerCase();

const getGids = async (pathId) => {
    let endpoint = new URL(`api/routes/${pathId}/guides`, BASE_URL);
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

const addOrder = async (data) => {
    let endpoint = new URL("api/orders", BASE_URL);
    endpoint.searchParams.set(varToString({API_KEY}), API_KEY);
    let response = await fetch(
        endpoint,
        {
            method: "POST",
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

const getPaths = async () => {
    let endpoint = new URL("api/routes", BASE_URL);
    endpoint.searchParams.set(varToString({API_KEY}), API_KEY);
    let response = await fetch(endpoint);
    if (response.ok) {
        let datas = await response.json();
        if ("error" in datas) throw new Error(datas.error);
        else {
            return datas;
        }
    } else throw new Error(response.status);
};


const STATE = {
    mainObjects: new Set(),
    langs: new Set(),
    paths: [],
    gids: [],
    totalPages: 0,
    perPage: 10,
    currentPage: 1,
    activePath: -1,
    activeGid: -1,
    filteredPaths: [],
    filteredGids: []
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

const updateToooltip = async () => {
    let tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
};

const parsePathsEntries = async (mainObjects) => {
    let flag = false;
    if (mainObjects.indexOf("Маршрут") != -1) {
        for (let obj of mainObjects.split(/Маршрут \d: /).slice(1)) {
            await parsePathsEntries(obj);
        }
        return;
    }
    if (mainObjects.indexOf(":") != -1) {
        mainObjects = mainObjects.slice(mainObjects.indexOf(":") + 2);
        flag = true;
    }
    if (mainObjects.split(
        /\s–\s[^а-я]|\s-\s[^а-я]|\)\s–\s[а-я]|\d\s-\s[а-я]/).length != 1) {
        for (let obj of mainObjects.split(/\s?-\s|\s?–\s/)) {
            obj = obj.trim();
            if (obj)
                STATE.mainObjects.add(!flag ? obj : obj.split(',')[0].trim());
        }
    } else if ([...mainObjects.matchAll(/(\. |^).*?\./g)].length > 1) {
        for (let obj of mainObjects.replaceAll("им.", '&')
            .matchAll(/(\. |^).*?\./g)) {
            STATE.mainObjects.add(obj[0].replaceAll('.', '')
                .replaceAll('&', 'им.').trim());
        }
    } else if ([...mainObjects.matchAll(/(\, |^).*?[,.]/g)].length > 1) {
        for (let obj of mainObjects.matchAll(/(\, |^).*?[,.]/g)) {
            STATE.mainObjects.add(obj[0].replaceAll(',', '').trim());
        }
    }
};

const fillPaths = async (paths) => {
    const PATHS_BODY = document.getElementById("paths_body");
    PATHS_BODY.innerHTML = "";
    let index = (STATE.currentPage - 1) * STATE.perPage;
    for (let i = index; i < index + STATE.perPage 
        && i < paths.length; i++) {
        let pathNode = document.querySelector('#path').content
            .firstElementChild.cloneNode(true);
        pathNode.children[0].innerHTML = paths[i].name;
        if (paths[i].description.length > 255) {
            pathNode.children[1].innerHTML = 
                paths[i].description.slice(0, 252) + '...';
            pathNode.children[1].setAttribute("data-bs-toggle", "tooltip");
            pathNode.children[1].setAttribute("data-bs-placement", "top");
            pathNode.children[1].setAttribute("title", paths[i].description);
        } else pathNode.children[1].innerHTML = paths[i].description;
        if (paths[i].mainObject.length > 255) {
            pathNode.children[2].innerHTML = 
                paths[i].mainObject.slice(0, 252) + '...';
            pathNode.children[2].setAttribute("data-bs-toggle", "tooltip");
            pathNode.children[2].setAttribute("data-bs-placement", "top");
            pathNode.children[2].setAttribute("title", paths[i].mainObject);
        } else pathNode.children[2].innerHTML = paths[i].mainObject;
        pathNode.id = paths[i].id;
        PATHS_BODY.append(pathNode);
    }
    await updateToooltip();
};  

const loadPaths = async () => {
    try {
        let paths = await getPaths();
        for (let path of paths) {
            STATE.paths.push(path);
            await parsePathsEntries(path.mainObject);
        }
        STATE.filteredPaths = STATE.paths;
        STATE.totalPages = ((STATE.filteredPaths.length / STATE.perPage) | 0)
            + (STATE.filteredPaths.length % STATE.perPage == 0 ? 0 : 1);
        await fillPaths(paths);
        let mainObjFilter = document.getElementById("path-s");
        mainObjFilter.innerHTML = 
            "<option selected value=\"-\">Основной объект</option>";
        let temp = [...STATE.mainObjects.values()];
        for (let i = 0; i < STATE.mainObjects.size; i++) {
            mainObjFilter.innerHTML += 
                `<option value="${i}">${temp[i]}</option>`;
        }
    } catch (e) {
        showMessage("Ошибка!", e.message, "alert-danger");
        throw e;
    }
};

const fillGids = async (gids) => {
    const GIDS_BODY = document.getElementById("gids_body");
    GIDS_BODY.innerHTML = "";
    for (let i = 0; i < gids.length; i++) {
        let gidNode = document.querySelector('#gid').content
            .firstElementChild.cloneNode(true);
        gidNode.children[1].innerHTML = gids[i].name;
        gidNode.children[2].innerHTML = gids[i].language;
        gidNode.children[3].innerHTML = gids[i].workExperience;
        gidNode.children[4].innerHTML = gids[i].pricePerHour;
        gidNode.id = gids[i].id;
        GIDS_BODY.append(gidNode);
    }
};

const fillGidsFilter = async () => {
    let langFilter = document.getElementById("gid-s");
    langFilter.innerHTML = 
        "<option selected value=\"-\">Языки экскурсии</option>";
    for (let lang of STATE.langs) {
        langFilter.innerHTML += `<option>${lang}</option>`;
    }
};

const loadGids = async (pathId) => {
    try {
        delete STATE.langs;
        STATE.langs = new Set();
        let gids = await getGids(pathId);
        STATE.gids = [];
        for (let gid of gids) {
            STATE.gids.push(gid);
            STATE.langs.add(gid.language);
        }
        fillGidsFilter();
        await fillGids(gids);
    } catch (e) {
        showMessage("Ошибка!", e.message, "alert-danger");
        throw e;
    }
};

const modalOpen = async (e) => {
    document.getElementById("gid-name").innerHTML = STATE.gids.filter(
        (gid) => gid.id == STATE.activeGid)[0].name;
    document.getElementById("path-name").innerHTML = STATE.paths.filter(
        (path) => path.id == STATE.activePath)[0].name;
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
    return start >= now && now <= end ? 400 : 0;
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
    return start >= now && now <= end ? 1000 : 0;
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
    let price = STATE.gids.filter((gid) => gid.id == STATE.activeGid)[0]
        .pricePerHour * ma3.value * await isDayOf(ma1.value) +
        await isMorning(ma2.value) + await isEvening(ma2.value) + number;
    price *= await option1();
    price *= await option2(ma4.value);
    if (price == 0) throw new Error("Сурдопереводчик работает только с "
        + "группами до 10 человек");
    return Math.ceil(price);
};

const saveState = async () => {
    if (STATE.activePath != -1)
        sessionStorage.setItem("path", STATE.activePath);
    if (STATE.activeGid != -1)
        sessionStorage.setItem("gid", STATE.activeGid);
};

const pathSelect = async (target) => {
    try {
        if (target == null) return;
        document.getElementById("submit-section").className = "visually-hidden";
        let old = target.closest(".table-responsive")
            .querySelector('tr.backBlue');
        if (old != null) old.className = "";
        let tr = target.closest("tr");
        STATE.activePath = tr.id;
        tr.className = "backBlue";
        document.getElementById("path_id").innerHTML = tr.children[0].innerHTML;
        document.getElementById("gid-section").className = "";
        await loadGids(tr.id);
    } catch (e) {
        throw e;
    }
};

const gidSelect = async (target) => {
    if (target == null) return;
    let old = target.closest(".table-responsive")
        .querySelector('tr.backBlue');
    if (old != null) old.className = "text-center";
    let tr = target.closest("tr");
    STATE.activeGid = tr.id;
    tr.className += " backBlue";
    document.getElementById("submit-section").className = "";
};

const loadStatePaths = async () => {
    try {
        let path = sessionStorage.getItem("path");
        if (path != null) {
            STATE.activePath = path;
            pathSelect(
                document.querySelector(
                    `tbody[id="paths_body"] tr[id="${path}"] button`)
            );
        }
    } catch (e) {
        throw e;
    }
};

const loadStateGids = async () => {
    let gid = sessionStorage.getItem("gid");
    if (gid != null) {
        STATE.activeGid = gid;
        gidSelect(
            document.querySelector(
                `tbody[id="gids_body"] tr[id="${gid}"] button`)
        );
    }
};

const unsetState = async () => {
    sessionStorage.removeItem("path");
    sessionStorage.removeItem("gid");
    let gb = document.querySelector(
        `tbody[id="gids_body"] tr[id="${STATE.activeGid}"]`);
    if (gb != null) gb.className = "text-center";
    let pb = document.querySelector(
        `tbody[id="paths_body"] tr[id="${STATE.activePath}"]`);
    if (pb != null) pb.className = "";
    document.getElementById("gid-section").className = "visually-hidden";
    document.getElementById("submit-section").className = "visually-hidden";
    STATE.activeGid = STATE.activePath = -1;
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
                document.getElementById("surd").checked = false;
                document.getElementById("surd").disabled = true;
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
        formData.set("route_id", STATE.activePath);
        formData.set("guide_id", STATE.activeGid);
        formData.set("price", cost);
        formData.set("optionFirst", int ? 1 : 0);
        formData.set("optionSecond", surd ? 1 : 0);
        await addOrder(formData);
        await unsetState();
        form.reset();
        await showMessage("Успех!", "Заявка добавлена");
    } catch (e) {
        showMessage("Ошибка!", e.message, "alert-danger");
    }
};

const goToPage = async (pageNum) => {
    try {
        STATE.currentPage = pageNum;
        await fillPaths(STATE.filteredPaths);
    } catch (e) {}
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
    await fillPaths(STATE.filteredPaths);
};

const filterInput = async (target) => {
    if (target.value == '') return STATE.paths;
    return STATE.paths.filter(
        (path) => path.name.toLowerCase().indexOf(
            target.value.toLowerCase()) != -1
    );
};

const filterSelect = async (target) => {
    let result = await filterInput(document.getElementById('path-in-filter'));
    STATE.filteredPaths = result;
    STATE.totalPages = ((STATE.filteredPaths.length / STATE.perPage) | 0)
        + (STATE.filteredPaths.length % STATE.perPage == 0 ? 0 : 1);
    if (target.options[target.selectedIndex].text == 'Основной объект')
        return result;
    result = result.filter(
        (path) => path.mainObject.toLowerCase().indexOf(
            target.options[target.selectedIndex].text.toLowerCase()) != -1
    );
    return result;
};

const onPathFilter = async (e) => {
    try {
        STATE.currentPage = 1;
        await fillPaths(await filterSelect(e.target.closest('form')
            .querySelector('[id="path-s"]')));
    } catch (e) { }
};

const filterInputG = async (target1, target2) => {
    if (target1.value == '' && target2.value == '') return STATE.gids;
    if (target1.value != '' && target2.value != '')
        return STATE.gids.filter(
            (gid) => gid.workExperience >= target1.value 
                && gid.workExperience <= target2.value
        );
    else if (target1.value != '')
        return STATE.gids.filter((gid) => gid.workExperience >= target1.value);
    else
        return STATE.gids.filter((gid) => gid.workExperience <= target2.value);
};

const filterSelectG = async (target) => {
    let result = await filterInputG(document.getElementById('from'),
        document.getElementById('to'));
    if (target.options[target.selectedIndex].text == 'Языки экскурсии')
        return result;
    result = result.filter(
        (gid) => gid.language.indexOf(
            target.options[target.selectedIndex].text) != -1
    );
    return result;
};

const onGidFilter = async (e) => {
    await fillGids(await filterSelectG(e.target.closest('form')
        .querySelector('[id="gid-s"]')));
    await loadStateGids();
};

window.onload = async () => {
    try {
        const observer_p = new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === "childList") {
                    try {
                        loadStatePaths();
                        numeration();
                    } catch (e) {}
                }
            }
        });
        observer_p.observe(document.getElementById("paths_body"),
            { attributes: false, childList: true, subtree: false }
        );
        const observer_gids = new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === "childList") {
                    loadStateGids();
                }
            }
        });
        observer_gids.observe(document.getElementById("gids_body"),
            { attributes: false, childList: true, subtree: false }
        );
        await loadPaths();
        document.getElementById("paths_body").onclick = async (e) => {
            try {
                if (e.target.className != "btn btn-primary") return;
                STATE.gids = [];
                STATE.filteredGids = [];
                STATE.activeGid = -1;
                sessionStorage.removeItem("gid");
                await pathSelect(e.target);
                await saveState();
                let obj = {target: document.getElementById("gid-filter")};
                onGidFilter(obj);
            } catch (e) { }
        };
        document.getElementById("gids_body").onclick = async (e) => {
            if (e.target.className != "btn btn-primary") return;
            await gidSelect(e.target);
            await saveState();
        };
        document.getElementById('ModalAdd').addEventListener(
            "show.bs.modal", modalOpen);
        document.getElementById('ModalAdd').addEventListener(
            "change", changeCost
        );
        document.getElementById('ex_add').onclick = onSumbitClick;
        document.getElementById('path-filter').addEventListener(
            "change", onPathFilter
        );
        document.getElementById('gid-filter').addEventListener(
            "change", onGidFilter
        );
        document.getElementById("prev").onclick = async (e) => 
            await getNearPage(-1);
        document.getElementById("next").onclick = async (e) => 
            await getNearPage(1);
    } catch (e) { }
};
