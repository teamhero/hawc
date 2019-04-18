import operator

from django.db.models import Q

from selectable.base import ModelLookup

from .helper import tryParseInt
from functools import reduce


class DistinctStringLookup(ModelLookup):
    """
    Return distinct strings for a single CharField in a model
    """
    distinct_field = None

    def get_query(self, request, term):
        return self.get_queryset()\
            .filter(**{self.distinct_field + "__icontains": term})\
            .order_by(self.distinct_field)\
            .distinct(self.distinct_field)

    def get_item_value(self, item):
        return getattr(item, self.distinct_field)

    def get_item_label(self, item):
        return self.get_item_value(item)


class RelatedLookup(ModelLookup):
    """
    Perform a search where related_filter is required, and search fields are
    ORd together. Ex:

        WHERE (self.related_filter = related_id) AND
              ( ... OR ... OR ...) for search fields
    """
    related_filter = None  # filter-string

    # given a string path like "related_item__some_field__foo". Rather than having to at compile time do:
    # obj.related_item.some_field.foo
    # this method instead drills down into the object. I was unable to find a Django method that would
    # do this for me, but if one exists, this could either be ripped out or rewritten to use it.
    def get_underscore_field_val(self, obj, underscore_path, default_val = None):
        driller = obj
        try:
            path_chunks = underscore_path.split("__")
            for chunk in path_chunks:
                driller = getattr(driller, chunk)
        except:
            return default_val

        return driller

    def get_query(self, request, term):
        id_ = tryParseInt(request.GET.get('related'), -1)

        qs = self.get_queryset()
        search_fields = [
            Q(**{field: term})
            for field in self.search_fields
        ]
        return qs.filter(
            Q(**{self.related_filter: id_}) &
            reduce(operator.or_, search_fields)
        )


class RelatedDistinctStringLookup(DistinctStringLookup):
    related_filter = None

    def get_query(self, request, term):
        qs = super().get_query(request, term)
        id_ = tryParseInt(request.GET.get('related'), -1)

        return qs.filter(
            Q(**{self.related_filter: id_})
        )
