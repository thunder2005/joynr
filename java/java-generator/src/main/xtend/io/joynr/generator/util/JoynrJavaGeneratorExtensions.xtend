package io.joynr.generator.util
/*
 * !!!
 *
 * Copyright (C) 2011 - 2015 BMW Car IT GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import java.util.Collections
import java.util.HashMap
import java.util.Iterator
import java.util.Map
import java.util.TreeSet
import org.franca.core.franca.FAttribute
import org.franca.core.franca.FBasicTypeId
import org.franca.core.franca.FBroadcast
import org.franca.core.franca.FCompoundType
import org.franca.core.franca.FEnumerationType
import org.franca.core.franca.FInterface
import org.franca.core.franca.FType
import org.franca.core.franca.FTypedElement

class JoynrJavaGeneratorExtensions extends JoynrGeneratorExtensions {

//	@Inject private extension FrancaGeneratorExtensions

	private Map<FBasicTypeId,String> primitiveDataTypeDefaultMap;
//	private Map<FBasicTypeId,String> primitiveDataTypeNameMap;

	def String getNamespaceStarter(FInterface interfaceType) {
		getNamespaceStarter(getPackageNames(interfaceType));
	}

	def String getNamespaceStarter(FType datatype) {
		getNamespaceStarter(getPackageNames(datatype));
	}

	def String getNamespaceEnder(FInterface interfaceType) {
		getNamespaceEnder(getPackageNames(interfaceType));
	}

	def String getNamespaceEnder(FType datatype) {
		getNamespaceEnder(getPackageNames(datatype));
	}

	def boolean hasReadAttribute(FInterface interfaceType){
		for(attribute: interfaceType.attributes){
			if (isReadable(attribute)){
				return true
			}
		}
		return false
	}

	def boolean hasWriteAttribute(FInterface interfaceType){
		for(attribute: interfaceType.attributes){
			if (isWritable(attribute)){
				return true
			}
		}
		return false
	}

	def boolean hasMethodWithReturnValue(FInterface interfaceType){
		for(method: interfaceType.methods){
			if (!method.outputParameters.empty){
				return true
			}
		}
		return false
	}

	def boolean hasMethodWithoutReturnValue(FInterface interfaceType) {
		for (method: interfaceType.methods) {
			if (method.outputParameters.empty) {
				return true
			}
		}
		return false
	}

	def boolean hasMethodWithImplicitErrorEnum(FInterface interfaceType){
		for(method: interfaceType.methods){
			if (method.errors != null) {
				return true
			}
		}
		return false
	}

	def boolean hasMethodWithArguments(FInterface interfaceType){
		for(method: interfaceType.methods){
			if (getInputParameters(method).size>0){
				return true
			}
		}
		return false
	}

	def private String getNamespaceStarter(Iterator<String> packageList){
		return getNamespaceStarterFromPackageList(packageList);
	}

	def String getNamespaceStarterFromPackageList(Iterator<String> packageList){
		var sb = new StringBuilder();
		while(packageList.hasNext){
			sb.append("namespace " + packageList.next + "{ " );
		}
		return sb.toString();
	}

	def private String getNamespaceEnder(Iterator<String> packageList){
		return getNameSpaceEnderFromPackageList(packageList);
	}

	def String getNameSpaceEnderFromPackageList(Iterator<String> packageList){
		var sb = new StringBuilder();
		while(packageList.hasNext){
			sb.insert(0, "} /* namespace " + packageList.next + " */ " );
		}
		return sb.toString();
	}

	new () {
/*
		val Map<FBasicTypeId,String> aMap = new HashMap<FBasicTypeId,String>();
		aMap.put(FBasicTypeId::BOOLEAN, "bool");
		aMap.put(FBasicTypeId::STRING, "QString");
		aMap.put(FBasicTypeId::DOUBLE,"double");
		aMap.put(FBasicTypeId::INT16,"int");
		aMap.put(FBasicTypeId::INT32,"int");
		aMap.put(FBasicTypeId::INT64,"qint64");
		aMap.put(FBasicTypeId::INT8,"qint8");
		aMap.put(FBasicTypeId::UNDEFINED,"void");
		primitiveDataTypeNameMap = Collections::unmodifiableMap(aMap);
*/

	val Map<FBasicTypeId,String> bMap = new HashMap<FBasicTypeId,String>();
		bMap.put(FBasicTypeId::BOOLEAN, "false");
		bMap.put(FBasicTypeId::INT8, "0");
		bMap.put(FBasicTypeId::UINT8, "0");
		bMap.put(FBasicTypeId::INT16, "0");
		bMap.put(FBasicTypeId::UINT16, "0");
		bMap.put(FBasicTypeId::INT32, "0");
		bMap.put(FBasicTypeId::UINT32, "0");
		bMap.put(FBasicTypeId::INT64, "0L");
		bMap.put(FBasicTypeId::UINT64, "0l");
		//see bug JOYN-1521: floats are interpreted as double
		bMap.put(FBasicTypeId::FLOAT, "0d");
		bMap.put(FBasicTypeId::DOUBLE, "0d");
		bMap.put(FBasicTypeId::STRING, "\"\"");
		bMap.put(FBasicTypeId::BYTE_BUFFER, "new byte[0]");
		bMap.put(FBasicTypeId::UNDEFINED,"");

		primitiveDataTypeDefaultMap = Collections::unmodifiableMap(bMap);
	}
	override getMappedDatatype(FType datatype) {
		return datatype.joynrName
	}

	override getMappedDatatypeOrList(FType datatype, boolean array) {
		val mappedDatatype = getMappedDatatype(datatype);
		if (array) {
			return "List<" + getObjectDataTypeForPlainType(mappedDatatype) + ">";
		} else {
			return mappedDatatype;
		}
	}

	override getMappedDatatypeOrList(FBasicTypeId datatype, boolean array) {
		val mappedDatatype = getPrimitiveTypeName(datatype);
		if (array) {
			return "List<" + getObjectDataTypeForPlainType(mappedDatatype) + ">";
		} else {
			return mappedDatatype;
		}
	}

	override getDefaultValue(FTypedElement element) {
		getDefaultValue(element, "");
	}

	def getDefaultValue(FTypedElement element, String constructorParams) {
		//default values are not supported (currently) by the Franca IDL 
/*		if (member.getDEFAULTVALUE()!=null && !member.getDEFAULTVALUE().isEmpty()){
			if (isEnum(member)){
				val ENUMDATATYPETYPE enumDatatype = getDatatype(id) as ENUMDATATYPETYPE
				for (ENUMELEMENTTYPE element : getEnumElements(enumDatatype)){
					if (element.VALUE == member.DEFAULTVALUE){
						return enumDatatype.SHORTNAME.toFirstUpper + "::" + element.SYNONYM
					}
				}
				return getPackagePath(enumDatatype, "::") + "::" + enumDatatype.SHORTNAME.toFirstUpper + "::" +  (enumDatatype.ENUMERATIONELEMENTS.ENUMELEMENT.get(0) as ENUMELEMENTTYPE).SYNONYM
			}
			else if (isLong(member.getDATATYPEREF().getIDREF())){
				return member.getDEFAULTVALUE() + "L"
			}
			else if (isDouble(member.getDATATYPEREF().getIDREF())){
				return member.getDEFAULTVALUE() + "d"
			}
			else{
				return member.getDEFAULTVALUE();
			}
		} else */ if (isComplex(element.type)) {
			if ((isArray(element))){
				return "new ArrayList<" + element.type.complexType.joynrName + ">(" + constructorParams + ")";
			}
			else{
				return "new " + element.type.complexType.joynrName + "(" + constructorParams + ")";
			}
		} else if (isEnum(element.type)){
			if ((isArray(element))){
				return "new ArrayList<" + element.type.enumType.joynrName + ">(" + constructorParams + ")";
			}
			else{
				return  element.type.enumType.joynrName + "." + element.type.enumType.enumerators.get(0).joynrName;
			}
		} else if (!primitiveDataTypeDefaultMap.containsKey(element.type.predefined)) {
 			return "NaN";
 		} else if (isPrimitive(element.type)) {
			if ((isArray(element))){
				return "new ArrayList<" + getPrimitiveTypeName(getPrimitive(element.type)) + ">(" + constructorParams + ")";
			}
			else{
				return primitiveDataTypeDefaultMap.get(element.type.predefined);
			}
		}
	}

	def Iterable<String> getRequiredIncludesFor(FCompoundType datatype){
		getRequiredIncludesFor(datatype, true);
	}

	def Iterable<String> getRequiredIncludesFor(FCompoundType datatype, boolean includingExendedType){
		val members = getComplexAndEnumMembers(datatype);

		val typeList = new TreeSet<String>();
		if (hasExtendsDeclaration(datatype)){
			if (includingExendedType){
				typeList.add(getIncludeOf(getExtendedType(datatype)))
			}

			typeList.addAll(getRequiredIncludesFor(getExtendedType(datatype), false))
		}

		for (member : members) {
			val type = getDatatype(member.type);
			if (type instanceof FType){
				typeList.add(getIncludeOf(type));
			}
		}
		return typeList;
	}

	def Iterable<String> getRequiredIncludesFor(FInterface serviceInterface) {
		getRequiredIncludesFor(serviceInterface, true, true, true, true, true);
	}

	def Iterable<String> getRequiredIncludesFor(
			FInterface serviceInterface,
			boolean methods,
			boolean readAttributes,
			boolean writeAttributes,
			boolean notifyAttributes,
			boolean broadcasts
	) {
		val includeSet = new TreeSet<String>();
		for(datatype : getAllComplexAndEnumTypes(serviceInterface, methods, readAttributes, writeAttributes, notifyAttributes, broadcasts)) {
			if (datatype instanceof FType){
				includeSet.add(getIncludeOf(datatype));
			}
//			else{
//				includeSet.add(getIncludeOf(datatype as FBasicTypeId));
//			}
		}
		return includeSet;
	}

	def Iterable<String> getRequiredIncludesFor(FBroadcast broadcast) {
		val includeSet = new TreeSet<String>();
		for(datatype: getAllComplexAndEnumTypes(broadcast)) {
			if (datatype instanceof FType) {
				includeSet.add(getIncludeOf(datatype));
			}
		}
		return includeSet;
	}

	def String getIncludeOf(FType dataType) {
		return getPackagePathWithJoynrPrefix(dataType, ".") + "." + dataType.joynrName;
	}

	override String getOneLineWarning() {
		//return ""
		return "/* Generated Code */  "
	}

	override isReadonly(FAttribute fAttribute) { fAttribute.readonly }

	override isObservable(FAttribute fAttribute) { !fAttribute.noSubscriptions }

	override getPrimitiveTypeName(FBasicTypeId basicType) {
		switch basicType {
			case FBasicTypeId::BOOLEAN: "Boolean"
			case FBasicTypeId::INT8: "Byte"
			case FBasicTypeId::UINT8: "Byte"
			case FBasicTypeId::INT16: "Integer"
			case FBasicTypeId::UINT16: "Integer"
			case FBasicTypeId::INT32: "Integer"
			case FBasicTypeId::UINT32: "Integer"
			case FBasicTypeId::INT64: "Long"
			case FBasicTypeId::UINT64: "Long"
			case FBasicTypeId::FLOAT: "Double"
			case FBasicTypeId::DOUBLE: "Double"
			case FBasicTypeId::STRING: "String"
			case FBasicTypeId::BYTE_BUFFER: "byte[]"
			default: throw new IllegalArgumentException("Unsupported basic type: " + basicType.joynrName)
		}
	}

	def String getObjectDataTypeForPlainType(String plainType) {
		var type = plainType.toLowerCase
		switch (plainType) {
			case FBasicTypeId::BOOLEAN.getName: type = "Boolean"
			case FBasicTypeId::INT8.getName: type = "Byte"
			case FBasicTypeId::UINT8.getName: type = "Byte"
			case FBasicTypeId::INT16.getName: type = "Integer"
			case FBasicTypeId::UINT16.getName: type = "Integer"
			case FBasicTypeId::INT32.getName: type = "Integer"
			case FBasicTypeId::UINT32.getName: type = "Integer"
			case FBasicTypeId::INT64.getName: type = "Long"
			case FBasicTypeId::UINT64.getName: type = "Long"
			case FBasicTypeId::FLOAT.getName: type = "Double"
			case FBasicTypeId::DOUBLE.getName: type = "Double"
			case FBasicTypeId::STRING.getName: type = "String"
			case FBasicTypeId::BYTE_BUFFER.getName: type = "byte[]"
			case "void": type = "Void"
			default :  type = plainType
		}

		return type
	}
	// Returns true if a class or superclass has array members
	def boolean hasArrayMembers(FCompoundType datatype){
		for (member : datatype.members) {
			if (isArray(member)){
				return true
			}
		}
		// Check any super classes
		if (hasExtendsDeclaration(datatype)) {
			return hasArrayMembers(datatype.extendedType)
		}
		return false
	}

	// Returns true if a class has to create lists in its constructor
	def boolean hasListsInConstructor(FCompoundType datatype){
		for (member : datatype.members) {
			if (isArray(member)){
				return true
			}
		}
		return false
	}

	def getJoynTypePackagePrefix(){
		joynrGenerationPrefix
	}

	def generateEnumCode(FEnumerationType enumType) {
		val typeName = enumType.joynrName
'''
public enum «typeName» {
	«FOR enumValue : getEnumElementsAndBaseEnumElements(enumType) SEPARATOR ","»
	«enumValue.joynrName»
	«ENDFOR»;

	static final Map<Integer, «typeName»> ordinalToEnumValues = new HashMap<Integer, «typeName»>();

	static{
		«var i = -1»
		«FOR enumValue : getEnumElementsAndBaseEnumElements(enumType)»
		ordinalToEnumValues.put(Integer.valueOf(«IF enumValue.value==null|| enumValue.value.equals("")»«i=i+1»«ELSE»«enumValue.value»«ENDIF»), «enumValue.joynrName»);
		«ENDFOR»
	}

	public static «typeName» getEnumValue(Integer ordinal) {
		return ordinalToEnumValues.get(ordinal);
	}

	public Integer getOrdinal() {
		// TODO should we use a bidirectional map from a third-party library?
		Integer ordinal = null;
		for(Entry<Integer, «typeName»> entry : ordinalToEnumValues.entrySet()) {
			if(this == entry.getValue()) {
				ordinal = entry.getKey();
				break;
			}
		}
		return ordinal;
	}
}
'''
	}
}
