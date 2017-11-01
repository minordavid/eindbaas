class human(object):

    def __init__(self, name, length, sex, weight, age = 0):
        self.name = name
        self.age = age
        self.length = length
        self.sex = sex
        self.weight = weight


    def get_BMI(self):
        return self.weight / (self.length ** 2)

class Student(human):
    def __init__ (self, name, length, grade, age, weight = 60, sex ='m'):
        super().__init__(age = age, name = name, length = length, sex = sex, weight = weight)
        self.grade = grade

hans = human('hansje', 1.20, 'm', 60, 21)
print(hans.get_BMI())