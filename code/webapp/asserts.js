class Assert {
	static isNonEmptyArray(value, errorMsg = "Invalid array") {
		if (!Array.isArray(value) || value.length === 0) {
			throw new Error(
				`${errorMsg}, expected a non empty array and got ${JSON.stringify(
					value
				)} instead`
			)
		}
	}
	static isNumber(value, errorMsg = "Invalid number") {
		if (
			value === undefined ||
			value === null ||
			typeof value !== "number" ||
			isNaN(value)
		) {
			throw new Error(
				`${errorMsg}, expected a number and got ${value} instead`
			)
		}
	}
	static isIdentifiable(value, errorMsg) {
		if (
			value === undefined ||
			value === null ||
			typeof value !== "object" ||
			!Assert.isStringId(value.id)
		) {
			throw new Error(
				`${errorMsg}, expected an identifiable object and got ${JSON.stringify(
					value
				)} instead`
			)
		}
	}
	static isInstanceOf(value, instance, errorMsg) {
		if (!(value instanceof instance)) {
			throw new Error(
				`${errorMsg}, expected an instance of ${
					instance.name
				} and got ${JSON.stringify(value)} instead`
			)
		}
	}

	static isPositiveNumber(value, errorMsg) {
		this.isNumber(value, errorMsg)
		if (value < 0) {
			throw new Error(
				`${errorMsg}, expected a positive number and got ${value} instead`
			)
		}
	}

	static isStringId(value, msg = "Invalid id") {
		if (typeof value !== "string" && value.length < 5) {
			throw new Error(
				`${msg}, expected a string id but instead got ${JSON.stringify(
					value
				)}`
			)
		}
	}
}

export default Assert
