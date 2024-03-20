const fss = require('fs')
const fs = require('fs').promises


function clean_email(firstName, surname, nameCounter) {

    const name_key = `${firstName}.${surname}`;
    const email_key = `${name_key}@example.com`;

    const total_number = nameCounter[name_key] || 0;
    if (total_number > 1) {
        if (!clean_email.emailNumbers) {
            clean_email.emailNumbers = {};
        }
        const current_number = (clean_email.emailNumbers[name_key] || 0) + 1;
        clean_email.emailNumbers[name_key] = current_number;
        return `${name_key}${current_number}@example.com`;
    } else {
        return email_key;
    }
}

class Data_Processing {
    constructor() {
        this.raw_user_data = "";
        this.formatted_user_data = [];
        this.cleaned_user_data = [];
        this.non_duplicated_data = [];
    }

    // Load data from csv
    load_CSV(filename) {
        this.raw_user_data = fss.readFileSync(`${filename}.csv`, 'utf8');
    }

    // Save formatted data to json file
    save_formatted_data(file_path) {
        try {
            //
            const data = JSON.stringify(this.formatted_user_data, null, 2);
            //
            fs.writeFile(file_path, data, 'utf-8');
            console.log('Data saved to file successfully.');
        } catch (error) {
            console.error('Failed to save data to file:', error);
        }
    }


    // Convert those ages with words to bits
    word_number_to_bit(word) {
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
    convert_month_date(date_of_birth, input_age) {
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
        input_age = isNaN(input_age) && typeof input_age === 'string' ? this.word_number_to_bit(input_age.toLowerCase()) : input_age;

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
            const current_year = new Date(2024, 1, 26).getFullYear();
            const last_two_digits = parseInt(current_year.toString().slice(-2), 10);
            const first_two_digits = (parseInt(year) > last_two_digits) ? '19' : '20';
            year = first_two_digits + year;
        }

        date_of_birth = `${day}/${month}/${year}`;

        let age = input_age;
        return {date: date_of_birth, corrected_age: age.toString()};
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


            const {date: corrected_birth, corrected_age: true_age} = this.convert_month_date(date_of_birth, age);

            return {
                title: title,
                first_name: first_name,
                middle_name: middle_name,
                surname: sur_name,
                date_of_birth: corrected_birth,
                age: Number(true_age),
                email: email
            };
        });
    }

    clean_data() {
        // First, remove duplicates
        const usr_map = new Map();
        const unique_usr = this.formatted_user_data.filter(user => {
            const {title, first_name, middle_name, surname, date_of_birth, age} = user;
            const usr_key = `${title}-${first_name}-${middle_name}-${surname}-${date_of_birth}-${age}`;

            if (usr_map.has(usr_key)) {
                return false;
            } else {
                usr_map.set(usr_key, true);
                return true;
            }
        });
        this.non_duplicated_data = unique_usr;
        // Second, clean title, first_name, surname, age
        this.cleaned_user_data = unique_usr.map(user => {
            let {title, first_name, middle_name, surname, date_of_birth, age, email} = user;

            title = this.clean_title(title);
            first_name = this.clean_first_name(first_name, email);
            surname = this.clean_sur_name(surname, email);
            age = this.clean_age(date_of_birth);
            return {title, first_name, middle_name, surname, date_of_birth, age, email};
        });

        //Then can do clean email, because if not cleaned others data, there maybe lack of names
        const counter = {};
        this.cleaned_user_data.forEach(({first_name, surname}) => {
            const name_key = `${first_name}.${surname}`;
            counter[name_key] = (counter[name_key] || 0) + 1;
        });

        // Then clean email
        this.cleaned_user_data = this.cleaned_user_data.map(user => {
            let {title, first_name, middle_name, surname, date_of_birth, age, email} = user;
            email = clean_email(first_name, surname, counter);
            return {title, first_name, middle_name, surname, date_of_birth, age, email};
        });

    }

    clean_title(title) {
        title = title.replace("Dr.", "Dr");
        const titles = ["Mr", "Mrs", "Miss", "Ms", "Dr"];
        return titles.includes(title) ? title : "";
    }

    clean_first_name(name, email) {
        if (name) return name;
        const email_part = email.split('@')[0].split('.');
        return email_part[0];
    }

    clean_sur_name(name, email) {
        if (name) return name;
        const email_part = email.split('@')[0].split('.');
        let sur_name_maybe_with_bit = email_part.length > 1 ? email_part[1] : "";
        const sur_name = sur_name_maybe_with_bit.replace(/[0-9]/g, '');
        return sur_name;
    }

    clean_age(date_of_birth) {
        const collected_date = new Date(2024, 1, 26);
        const birth_dat_part = date_of_birth.split('/');
        const birth_date = new Date(parseInt(birth_dat_part[2], 10), parseInt(birth_dat_part[1], 10) - 1, parseInt(birth_dat_part[0], 10));

        let age_year = collected_date.getFullYear() - birth_date.getFullYear();
        const month = collected_date.getMonth() - birth_date.getMonth();
        // Check if reached birthday
        if (month < 0 || (month === 0 && collected_date.getDate() < birth_date.getDate())) {
            age_year--;
        }

        return age_year;
    }

    most_common_surname() {
        const count = {};

        this.cleaned_user_data.forEach(({surname}) => {
            count[surname] = (count[surname] || 0) + 1;
        });

        let most_common_surnames = [];
        let max = 0;

        Object.entries(count).forEach(([surname, count]) => {
            if (count > max) {
                max = count;
                most_common_surnames = [surname];
            } else if (count === max) {
                most_common_surnames.push(surname);
            }
        });

        return most_common_surnames;
    }

    average_age() {
        const age_sum = this.cleaned_user_data.reduce((acc, {age}) => acc + age, 0);
        const average = age_sum / this.cleaned_user_data.length;
        return parseFloat(average.toFixed(1));
    }

    youngest_dr() {
        const doctors = this.cleaned_user_data.filter(user => user.title === 'Dr');
        let youngest = doctors[0];
        for (let i = 1; i < doctors.length; i++) {
            if (doctors[i].age < youngest.age) {
                youngest = doctors[i];
            }
        }
        return youngest;
    }

    most_common_month() {
        const count = {};
        this.cleaned_user_data.forEach(user => {
            const month = parseInt(user.date_of_birth.split('/')[1], 10).toString();
            if (count[month]) {
                count[month]++;
            } else {
                count[month] = 1;
            }
        });
        let most_common_month = 0;
        let highest_count = 0;
        for (const month in count) {
            if (count[month] > highest_count) {
                most_common_month = month;
                highest_count = count[month];
            }
        }
        return most_common_month;
    }

    percentage_titles() {
        const title_count = {
            "Mr": 0,
            "Mrs": 0,
            "Miss": 0,
            "Ms": 0,
            "Dr": 0,
            "": 0
        };

        this.cleaned_user_data.forEach(user => {
            title_count[user.title]++;
        });

        const total_usr = this.cleaned_user_data.length;

        const percentages = Object.values(title_count).map(count => Math.round((count / total_usr) * 100));

        return percentages;
    }

    percentage_altered() {
        const total_data = this.formatted_user_data.length * 7;

        const not_matched = this.cleaned_user_data.filter(cleaned_data =>
            !this.non_duplicated_data.some(non_duplicated =>
                cleaned_data.title === non_duplicated.title &&
                cleaned_data.first_name === non_duplicated.first_name &&
                cleaned_data.middle_name === non_duplicated.middle_name &&
                cleaned_data.surname === non_duplicated.surname &&
                cleaned_data.date_of_birth === non_duplicated.date_of_birth &&
                cleaned_data.age === non_duplicated.age &&
                cleaned_data.email === non_duplicated.email
            )
        );

        let different_count_values = 0;

        not_matched.forEach(not_matched_data => {
            const matched = this.non_duplicated_data.find(target_helper =>
                not_matched_data.middle_name === target_helper.middle_name && not_matched_data.date_of_birth === target_helper.date_of_birth
            );

            if (matched) {
                ['title', 'first_name', 'surname', 'age', 'email'].forEach(key => {
                    if (not_matched_data[key] !== matched[key]) {
                        different_count_values++;
                    }
                });
            }
        });

        // console.log(different_count_values);
        const changed_data = different_count_values + (this.formatted_user_data.length - this.cleaned_user_data.length) * 7;
        //console.log(changed_data)
        const percentage = (changed_data / total_data) * 100;
        return percentage.toFixed(1);
    }
}


// const dataProcessor = new Data_Processing();
// dataProcessor.load_CSV("Raw_User_Data");
// dataProcessor.format_data();
// dataProcessor.clean_data();
// console.log(dataProcessor.percentage_altered())
