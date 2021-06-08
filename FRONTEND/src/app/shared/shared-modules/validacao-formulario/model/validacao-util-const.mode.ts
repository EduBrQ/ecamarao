export const ValidacaoUtils = {
    validarCPf: (cpf) => {
        if (!cpf) {
            return false;
        }
        if (cpf.length === 11) {
            cpf = cpf.replace(/\D+/g, '');
            if (cpf.length < 11) {
                return false;
            }
            let soma;
            let resto;
            soma = 0;

            for (let i = 1; i <= 9; i++) {
                soma = soma + parseInt(cpf.substring(i - 1, i), 0) * (11 - i);
            }
            resto = (soma * 10) % 11;

            if ((resto === 10) || (resto === 11)) { resto = 0; }
            if (resto !== parseInt(cpf.substring(9, 10), 0)) { return false; }

            soma = 0;
            for (let i = 1; i <= 10; i++) { soma = soma + parseInt(cpf.substring(i - 1, i), 0) * (12 - i); }
            resto = (soma * 10) % 11;

            if ((resto === 10) || (resto === 11)) { resto = 0; }
            if (resto !== parseInt(cpf.substring(10, 11), 0)) { return false; }
            return true;
        } else {
            return false;
        }

    },
    validarCnpj: (cnpj) => {
        if (!cnpj) {
            return false;
        }

        if (cnpj.length === 14) {
            cnpj = cnpj.replace(/\D+/g, '');
            if (cnpj.length < 14) {
                return false;
            }

            // valores usados como peso nos cálculos
            const digitosVerificadores = {
                digitoUm: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
                digitoDois: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            };

            // calcula primeiro digito verificador
            const resultadoVerificadorUm = validarDigitoVerificador(cnpj, digitosVerificadores.digitoUm);

            // calcula segundo digito verificador
            const resultadoVerificadorDois = validarDigitoVerificador(cnpj, digitosVerificadores.digitoDois);

            return (cnpj.charAt(12) === resultadoVerificadorUm.toString() && cnpj.charAt(13) === resultadoVerificadorDois.toString()) ? true : false;
        } else if (cnpj.length === 18) {
            cnpj = cnpj.replace(/\D+/g, '');
            if (cnpj.length < 14) {
                return false;
            }

            // valores usados como peso nos cálculos
            const digitosVerificadores = {
                digitoUm: [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
                digitoDois: [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            };

            // calcula primeiro digito verificador
            const resultadoVerificadorUm = validarDigitoVerificador(cnpj, digitosVerificadores.digitoUm);

            // calcula segundo digito verificador
            const resultadoVerificadorDois = validarDigitoVerificador(cnpj, digitosVerificadores.digitoDois);

            return (cnpj.charAt(12) === resultadoVerificadorUm.toString() && cnpj.charAt(13) === resultadoVerificadorDois.toString()) ? true : false;
        } else {
            return false;
        }
        function validarDigitoVerificador(cnpjT, arrayDigitosVerificadores) {
            let resultado = cnpjT.substring(0, arrayDigitosVerificadores.length);
            resultado = arrayDigitosVerificadores.reduce((acumulador, alg, index) => acumulador + (alg * resultado[index]), 0) % 11;

            return resultado < 2 ? 0 : 11 - resultado;
        }
    }


};
