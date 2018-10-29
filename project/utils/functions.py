from django.db.models.aggregates import Func


class JSONBArrayElements(Func):
	function = "jsonb_array_elements"
	template = "%(function)s(%(expressions)s)"
	arity = 1

	def __init__(self, expression, **kwargs):
		super().__init__(expression, **kwargs)


class JSONBObjectAtPath(Func):
	function = "#>"
	template = "%(expressions)s%(function)s'{%(path)s}'"
	arity = 1

	def __init__(self, expression, path, **kwargs):
		if (isinstance(path, (list, tuple))):
			path = ','.join(path)

		super().__init__(expression, path=path, **kwargs)
