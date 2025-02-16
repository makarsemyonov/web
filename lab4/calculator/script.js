let currentMode = 'standard';
let display = document.getElementById('display');
let currentExpression = '';

document.querySelectorAll('.mode-btn').forEach(btn => {
   btn.addEventListener('click', () => {
       document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
       btn.classList.add('active');
       currentMode = btn.dataset.mode;
       document.getElementById('standard-buttons').style.display =
           currentMode === 'standard' ? 'grid' : 'none';
       document.getElementById('rpn-buttons').style.display =
           currentMode === 'rpn' ? 'grid' : 'none';

       currentExpression = '';
       display.value = '';
   });
});


document.querySelectorAll('#standard-buttons button').forEach(btn => {
   btn.addEventListener('click', () => {
       const op = btn.dataset.op;
       const num = btn.dataset.num;

       if (num) {
           currentExpression += num;
       } else if (op) {
           handleStandardOperation(op);
       }

       updateDisplay();
   });
});

function handleStandardOperation(op) {
    switch(op) {
        case 'C':
            currentExpression = '';
            break;
        case '±':
            try {
                const currentValue = parseFloat(currentExpression);
                if (!isNaN(currentValue)) {
                    currentExpression = (-currentValue).toString();
                } else {
                    currentExpression = 'Ошибка!';
                }
            } catch (error) {
                currentExpression = 'Ошибка!';
            }
            break;
        case '%':
            try {
                const currentValue = parseFloat(currentExpression);
                if (!isNaN(currentValue)) {
                    currentExpression = (currentValue / 100).toString();
                } else {

                    currentExpression = 'Ошибка!';
                }
            } catch (error) {
                currentExpression = 'Ошибка!';
            }
            break;
        case '=':
            try {
                currentExpression = eval(currentExpression).toString();
            } catch (error) {
                currentExpression = 'Ошибка!';
            }
            break;
        case '.':
            if (currentExpression.indexOf('.') === -1) {
                currentExpression += '.';
            }
            break;
        default:
            currentExpression += ` ${op} `;
    }
}


document.getElementById('rpn-buttons').addEventListener('click', e => {
    if (e.target.dataset.op === 'rpn-calc') {
        const input = document.getElementById('rpn-input').value.trim();
        try {
            const result = evaluateRPN(input);
            display.value = result;
        } catch (error) {
            display.value = 'Ошибка: ' + error.message;
        }
    }
});


document.getElementById('clear-rpn-input').addEventListener('click', () => {
    document.getElementById('rpn-input').value = ''; 
    display.value = ''; 
});

function evaluateRPN(expression) {
    const stack = [];
    const tokens = expression.split(' ');

    for (const token of tokens) {
        if (!isNaN(token) && isFinite(token)) {
            stack.push(parseFloat(token));
        } else {
            if (stack.length < 2) throw new Error('Недостаточно операндов');

            const b = stack.pop();
            const a = stack.pop();

            switch(token) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/':
                    if (b === 0) throw new Error('Деление на ноль');
                    stack.push(a / b);
                    break;
                default: throw new Error('Недопустимый оператор');
            }
        }
    }

    if (stack.length !== 1) throw new Error('Некорректное выражение');
    return stack.pop();
}

function updateDisplay() {
    display.value = currentExpression;
}
