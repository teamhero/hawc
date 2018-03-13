<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2005/xpath-functions">
	<xsl:output method="html" encoding="UTF-8" indent="yes" omit-xml-declaration="yes" />
	<xsl:variable name="specifierPre">
		<xsl:choose>
			<xsl:when test="/projectTags/specifierPre">
				<xsl:value-of select="/projectTags/specifierPre" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:text/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="specifierPost">
		<xsl:choose>
			<xsl:when test="/projectTags/specifierPost">
				<xsl:value-of select="/projectTags/specifierPost" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:text/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="htmlIdPrefix">
		<xsl:choose>
			<xsl:when test="/projectTags/htmlIdPrefix">
				<xsl:value-of select="/projectTags/htmlIdPrefix" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:text/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="tagLink">
		<xsl:choose>
			<xsl:when test="/projectTags/tagLink">
				<xsl:value-of select="/projectTags/tagLink" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:text/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="radioTree">
		<xsl:choose>
			<xsl:when test="/projectTags/radioTree">
				<xsl:value-of select="/projectTags/radioTree" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:text/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:template match="/">
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
		<xsl:variable name="usageCSS">
			<xsl:choose>
				<xsl:when test="usages/usage">
					<xsl:text>expandable lastExpandable</xsl:text>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>last</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<ul>
			<li class="{concat('closed ',$usageCSS)}">
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
		<xsl:variable name="usageCSS">
			<xsl:choose>
				<xsl:when test="usage">
					<xsl:text>expandable lastExpandable</xsl:text>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>last</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<li class="{concat('closed ',$usageCSS)}">
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