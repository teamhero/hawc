<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions">
	<xsl:output method="html" encoding="UTF-8" indent="yes" omit-xml-declaration="yes" />
	<xsl:variable name="specifierPre" as="xs:string" select="if(/projectTags/specifierPre) then /projectTags/specifierPre else ''"/>
	<xsl:variable name="specifierPost" as="xs:string" select="if(/projectTags/specifierPost) then concat('_',/projectTags/specifierPost) else '_'"/>
	<xsl:variable name="htmlIdPrefix" as="xs:string" select="if(/projectTags/htmlIdPrefix) then concat(/projectTags/htmlIdPrefix, '_') else ''"/>
	<xsl:variable name="tagLink" as="xs:string" select="if (/projectTags/tagLink) then /projectTags/tagLink else ''"/>
	<xsl:variable name="radioTree" as="xs:string" select="if (/projectTags/radioTree) then /projectTags/radioTree else ''"/>
	<xsl:template match="/">
		 <head>
		 	<script type="text/javascript" src="jquery-1.7.min.js">&#160;</script>
			<script type="text/javascript" src="jquery.treeview.js">&#160;</script>
			<style type="text/css">
    			<xsl:value-of select="document('jquery.tagtree.css')" disable-output-escaping="yes" />
			</style>
		</head>
		<xsl:for-each select="projectTags/category">
			<div class="tagtab" id="{concat('tab_category',$specifierPre,'_',category_id)}">
				<div style="width:100%;">
					<div class="checkboxsection">
						<div class="" id="{concat('tree',$specifierPost,category_id)}">
				<xsl:apply-templates select="project" />
						</div>
					</div>
				</div>
			</div>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="project">
		<ul>
			<li class="closed {if (usages/usage) then 'expandable lastExpandable' else 'last'}">
				<xsl:if test="usages/usage">
					<div id="{concat('hitarea_',$htmlIdPrefix,'project',$specifierPre,'_',project_id)}" class="hitarea closed-hitarea expandable-hitarea lastExpandable-hitarea"></div>
				</xsl:if>
				<xsl:choose>
					<xsl:when test="/projectTags/tagLink">
						<xsl:element name="a">
							<xsl:attribute name="href">
								<xsl:value-of select="concat($tagLink,'/project_id/',project_id)"/>
							</xsl:attribute>
							<xsl:value-of select="projectName"/><xsl:if test="casrn"> <xsl:value-of select="casrn"/></xsl:if>
						</xsl:element>
					</xsl:when>
					<xsl:when test="/projectTags/radioTree">
							<label><xsl:value-of select="projectName"/> <xsl:if test="casrn">&#160;<xsl:value-of select="casrn"/></xsl:if></label>
					</xsl:when>
					<xsl:otherwise>
						<xsl:element name="input">
							<xsl:attribute name="type">checkbox</xsl:attribute>
							<xsl:attribute name="id"><xsl:value-of select="concat($htmlIdPrefix,'project',$specifierPre,'_',project_id)"/></xsl:attribute>
							<xsl:attribute name="name">project_id</xsl:attribute>
							<xsl:if test="/projectTags/untagList">
								<xsl:choose>
									<xsl:when test="/projectTags/untagList/projectID = project_id"><xsl:attribute name="class">project_checkbox</xsl:attribute></xsl:when>
									<xsl:otherwise><xsl:attribute name="class">project_checkbox noUntag</xsl:attribute></xsl:otherwise>
								</xsl:choose>
							</xsl:if>
							<xsl:attribute name="value"><xsl:value-of select="project_id"/></xsl:attribute>
							<xsl:if test="/projectTags/checkedList/projectID = project_id">
								<xsl:attribute name="checked">checked</xsl:attribute>
							</xsl:if>
							<xsl:if test="/projectTags/untagList">
								<xsl:choose>
									<xsl:when test="/projectTags/untagList/projectID = project_id"/>
									<xsl:otherwise>
										<xsl:if test="/projectTags/checkedList/projectID = project_id">
											<xsl:attribute name="disabled">disabled</xsl:attribute>
										</xsl:if>
									</xsl:otherwise>
								</xsl:choose>
							</xsl:if>
						</xsl:element>
						<xsl:if test="/projectTags/untagList">
							<xsl:choose>
								<xsl:when test="/projectTags/untagList/projectID = project_id"/>
								<xsl:otherwise>
									<xsl:if test="/projectTags/checkedList/projectID = project_id">
										<xsl:element name="input">
											<xsl:attribute name="type">hidden</xsl:attribute>
											<xsl:attribute name="id"><xsl:value-of select="concat($htmlIdPrefix,'project',$specifierPre,'_',project_id,'_hidden')"/></xsl:attribute>
											<xsl:attribute name="name"><xsl:value-of select="concat('project_id',$specifierPre)"/></xsl:attribute>
											<xsl:attribute name="value"><xsl:value-of select="project_id"/></xsl:attribute>
										</xsl:element>
									</xsl:if>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:if>
						<label for="{concat($htmlIdPrefix,'project',$specifierPre,'_',project_id)}"><xsl:value-of select="projectName"/><xsl:if test="casrn">&#160;<xsl:value-of select="casrn"/></xsl:if></label>
					</xsl:otherwise>
				</xsl:choose>
				<xsl:if test="usages/usage">
					<ul style="display:none;">
					<xsl:apply-templates select="usages/usage">
						<xsl:with-param name="projID" select="project_id"/>
						<xsl:with-param name="parentID" select="concat('project_',project_id)"/>
					</xsl:apply-templates>
					</ul>
				</xsl:if>
			</li>
		</ul>
	</xsl:template>

	<xsl:template match="usage">
		<xsl:param name="projID"/>
		<xsl:param name="parentID"/>
		<li class="closed {if (usage) then 'expandable lastExpandable' else 'last'}">
			<xsl:if test="usage">
				<div id="{concat('hitarea_',$htmlIdPrefix,'usage',$specifierPre,'_',usage_id)}" class="hitarea closed-hitarea expandable-hitarea lastExpandable-hitarea"></div>
			</xsl:if>
			<xsl:choose>
				<xsl:when test="/projectTags/tagLink">
					<xsl:element name="a">
						<xsl:attribute name="href">
							<xsl:value-of select="concat($tagLink,'/usage_id/',usage_id)"/>
						</xsl:attribute>
						<xsl:value-of select="usage_name"/><xsl:if test="casrn"> <xsl:value-of select="casrn"/></xsl:if>
					</xsl:element>
				</xsl:when>
				<xsl:when test="/projectTags/radioTree">
					<xsl:element name="input">
						<xsl:attribute name="type">radio</xsl:attribute>
						<xsl:attribute name="id"><xsl:value-of select="concat($htmlIdPrefix,'usage',$specifierPre,'_',usage_id)"/></xsl:attribute>
						<xsl:attribute name="name">usage_id_target</xsl:attribute>
						<xsl:attribute name="value"><xsl:value-of select="usage_id"/></xsl:attribute>
					</xsl:element>
				</xsl:when>
				<xsl:otherwise>
					<xsl:element name="input">
						<xsl:attribute name="type">checkbox</xsl:attribute>
						<xsl:attribute name="id"><xsl:value-of select="concat($htmlIdPrefix,'usage',$specifierPre,'_',usage_id)"/></xsl:attribute>
						<xsl:attribute name="name">usage_id</xsl:attribute>
						<xsl:if test="/projectTags/untagList">
							<xsl:choose>
								<xsl:when test="/projectTags/untagList/projectID = $projID"><xsl:attribute name="class">usage_checkbox</xsl:attribute></xsl:when>
								<xsl:otherwise><xsl:attribute name="class">usage_checkbox noUntag</xsl:attribute></xsl:otherwise>
							</xsl:choose>
						</xsl:if>
						<xsl:attribute name="value"><xsl:value-of select="usage_id"/></xsl:attribute>
						<xsl:attribute name="data-parent-id"><xsl:value-of select="$parentID"/></xsl:attribute>
						<xsl:if test="/projectTags/checkedList/usageID = usage_id">
							<xsl:attribute name="checked">checked</xsl:attribute>
						</xsl:if>
						<xsl:if test="/projectTags/untagList">
							<xsl:choose>
								<xsl:when test="/projectTags/untagList/projectID = $projID"/>
								<xsl:otherwise>
									<xsl:if test="/projectTags/checkedList/usageID = usage_id">
										<xsl:attribute name="disabled">disabled</xsl:attribute>
									</xsl:if>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:if>
					</xsl:element>
					<xsl:if test="/projectTags/untagList">
						<xsl:choose>
							<xsl:when test="/projectTags/untagList/projectID = $projID"/>
							<xsl:otherwise>
								<xsl:if test="/projectTags/checkedList/projectID = $projID">
									<xsl:element name="input">
										<xsl:attribute name="type">hidden</xsl:attribute>
										<xsl:attribute name="id"><xsl:value-of select="concat($htmlIdPrefix,'usage',$specifierPre,'_',usage_id,'_hidden')"/></xsl:attribute>
										<xsl:attribute name="name"><xsl:value-of select="concat('usage_id',$specifierPre)"/></xsl:attribute>
										<xsl:attribute name="value"><xsl:value-of select="usage_id"/></xsl:attribute>
									</xsl:element>
								</xsl:if>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:if>
				</xsl:otherwise>
			</xsl:choose>	
			<label for="{concat($htmlIdPrefix,'usage',$specifierPre,'_',usage_id)}"><xsl:value-of select="usage_name"/><xsl:if test="casrn"> <xsl:value-of select="casrn"/></xsl:if></label>
			<xsl:if test="usage">
				<ul style="display:none;">
				<xsl:apply-templates select="usage">
					<xsl:with-param name="projID" select="$projID"/>
					<xsl:with-param name="parentID" select="concat('usage_',usage_id)"/>
				</xsl:apply-templates>
				</ul>
			</xsl:if>
		</li>
	</xsl:template>

</xsl:stylesheet>