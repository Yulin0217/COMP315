const fss = require('fs')
const fs = require('fs').promises

// Calculate ages for those data have no ages
function calculate_age(date_of_birth, current_date = new Date()) {
    const birth_date = new Date(date_of_birth);
    let age = current_date.getFullYear() - birth_date.getFullYear();
    const m = current_date.getMonth() - birth_date.getMonth();
    if (m < 0 || (m === 0 && current_date.getDate() < birth_date.getDate())) {
        age--;
    }
    return age;
}

// Convert those ages with words to bits
function word_number_to_bit(word) {
    const number_word_map = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
        "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
        "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40,
        "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80,
        "ninety": 90
    };

    let number = 0;
    if (word.indexOf("-") !== -1) {
        word.split("-").forEach(part => {
            number += number_word_map[part];
        });
    } else {
        number = number_word_map[word];
    }

    return number;
}

// Convert those months using words to digits
function convert_month_date(date_of_birth, input_age) {
    const month_map = {
        "January": "01",
        "February": "02",
        "March": "03",
        "April": "04",
        "May": "05",
        "June": "06",
        "July": "07",
        "August": "08",
        "September": "09",
        "October": "10",
        "November": "11",
        "December": "12"
    };
    input_age = isNaN(input_age) && typeof input_age === 'string' ? word_number_to_bit(input_age.toLowerCase()) : input_age;


    if (!input_age || input_age === "Unknown") {
        const birth_date = new Date(`${year}-${month}-${day}`);
        input_age = calculate_age(birth_date);
    }
    if (typeof date_of_birth !== 'string') {
        console.error('Invalid dateOfBirth:', date_of_birth);
        return { date: '01/01/1900', age: 'Unknown' };
    }

    let date_parts = date_of_birth.includes('/') ? date_of_birth.split('/') : date_of_birth.split(' ');
    let month, day, year;

    if (isNaN(date_parts[1])) {
        month = month_map[date_parts[1]];
        day = date_parts[0].padStart(2, '0');
        year = date_parts[2];
    } else {
        day = date_parts[0].padStart(2, '0');
        month = date_parts[1].padStart(2, '0');
        year = date_parts[2];
    }


    if (year.length === 2) {
        const current_year = new Date().getFullYear();
        const last_two_digits = parseInt(current_year.toString().slice(-2), 10);
        const first_two_digits = (parseInt(year) > last_two_digits) ? '19' : '20';
        year = first_two_digits + year;
    }

    date_of_birth = `${day}/${month}/${year}`;

    let age = input_age;
    if (!age) {
        age = calculate_age(`${year}-${month}-${day}`);
    }

    return { date: date_of_birth, corrected_age: age.toString() };
}



class Data_Processing {
    constructor() {
        this.raw_user_data = "";
        this.formatted_user_data = [];
        this.cleaned_user_data = [];
    }

    // Load data from csv
    load_CSV(filename) {
        this.raw_user_data = fss.readFileSync(`${filename}.csv`, 'utf8');
    }

    // Save formatted data to json file
    async save_formatted_data(file_path) {
        try {
            //
            const data = JSON.stringify(this.formatted_user_data, null, 2);
            //
            await fs.writeFile(file_path, data, 'utf-8');
            console.log('Data saved to file successfully.');
        } catch (error) {
            console.error('Failed to save data to file:', error);
        }
    }

    //Main method for formatting data
    format_data() {
        this.split_raw_user_data = this.raw_user_data.split('\n').filter(Boolean).map(row => row.split(','));
        this.formatted_user_data = this.split_raw_user_data.map(row => {
            const [full_name, date_of_birth, age, email] = row.map(item => item.trim());
            const titles = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Dr."];

            const parts_of_names = full_name.split(' ').filter(Boolean);
            let title = "";
            let first_name = '';
            let middle_name = '';
            let sur_name = '';


            if (titles.includes(parts_of_names[0])) {
                title = parts_of_names.shift();
            }

            if (parts_of_names.length >= 1) {
                first_name = parts_of_names[0];
            }
            if (parts_of_names.length >= 2) {
                sur_name = parts_of_names[parts_of_names.length - 1];
            }
            if (parts_of_names.length > 2) {
                middle_name = parts_of_names.slice(1, -1).join(' ');
            }


            const { date: corrected_birth, corrected_age: true_age } = convert_month_date(date_of_birth, age);

            return {
                title: title, // 可能为空
                first_name: first_name,
                middle_name: middle_name,
                surname: sur_name,
                date_of_birth: corrected_birth,
                age: Number(true_age),
                email: email
            };
        });
    }





    cleanData() {
        this.cleanedUserData = this.formattedUserData.map(user => {
            //
            let {title, first_name, middle_name, surname, date_of_birth, age, email} = user;

            //
            title = this.cleanTitle(title);
            first_name = this.cleanName(first_name);
            middle_name = this.cleanName(middle_name);
            surname = this.cleanName(surname);
            date_of_birth = this.cleanDateOfBirth(date_of_birth);
            age = this.cleanAge(date_of_birth, age);
            email = this.cleanEmail(email, first_name, surname);

            return {title, first_name, middle_name, surname, date_of_birth, age, email};
        });
        console.log('Processing clean data section!');
    }

    //

    cleanTitle(title) {
        //
        const validTitles = ["Mr", "Mrs", "Miss", "Ms", "Dr", "Dr."];
        return validTitles.includes(title) ? title : "";
    }

    cleanName(name) {
        //
        return name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('-');
    }

    cleanDateOfBirth(dob) {
        //
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        return regex.test(dob) ? dob : "01/01/1900";
    }

    cleanAge(dob, age) {

        const calculatedAge = this.calculateAgeFromDob(dob);
        return calculatedAge.toString() === age ? age : calculatedAge.toString();
    }

    calculateAgeFromDob(dob) {
        const [day, month, year] = dob.split('/').map(part => parseInt(part, 10));
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    cleanEmail(email, firstName, surname) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (regex.test(email)) {
            return email;
        } else {
            const cleanFirstName = firstName.toLowerCase().replace(/\s+/g, '');
            const cleanSurname = surname.toLowerCase().replace(/\s+/g, '');
            return `${cleanFirstName}.${cleanSurname}@example.com`;
        }
    }


}
// //
// const dataProcessor = new Data_Processing();
//
// // 直接按顺序执行方法
// dataProcessor.load_CSV("Raw_User_Data");
// dataProcessor.format_data();
// //dataProcessor.cleanData();
// dataProcessor.save_formatted_data("./formattedUserData.json");